from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"
    PARENT = "parent"

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"
    MEDICAL = "medical"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    picture: Optional[str] = None
    role: UserRole
    student_id: Optional[str] = None  # For students
    parent_child_ids: Optional[List[str]] = []  # For parents - list of student IDs
    class_id: Optional[str] = None  # For students
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Class(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "12-A Commerce"
    division: str  # e.g., "A"
    stream: str  # e.g., "Commerce", "Science"
    grade: str = "12"
    teacher_ids: List[str] = []
    student_ids: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AttendanceRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    class_id: str
    date: str  # YYYY-MM-DD format
    status: AttendanceStatus
    marked_by: str  # teacher ID
    notes: Optional[str] = None
    marked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Request/Response Models
class SessionRequest(BaseModel):
    session_id: str

class SessionResponse(BaseModel):
    user: User
    session_token: str

class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str
    role: UserRole
    student_id: Optional[str] = None
    parent_child_ids: Optional[List[str]] = []
    class_id: Optional[str] = None

class CreateClassRequest(BaseModel):
    name: str
    division: str
    stream: str
    grade: str = "12"

class AttendanceRequest(BaseModel):
    student_id: str
    status: AttendanceStatus
    notes: Optional[str] = None

class BulkAttendanceRequest(BaseModel):
    class_id: str
    date: str  # YYYY-MM-DD
    attendance_records: List[AttendanceRequest]

# Helper Functions
def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    """Parse datetime strings back from MongoDB"""
    if isinstance(item, dict):
        for key, value in item.items():
            if key in ['created_at', 'marked_at', 'expires_at'] and isinstance(value, str):
                try:
                    item[key] = datetime.fromisoformat(value)
                except:
                    pass
    return item

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token (cookie first, then header)"""
    session_token = None
    
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    # Find session in database
    session_doc = await db.sessions.find_one({"session_token": session_token})
    if not session_doc:
        return None
    
    session = UserSession(**parse_from_mongo(session_doc))
    
    # Check if session is expired
    if session.expires_at < datetime.now(timezone.utc):
        await db.sessions.delete_one({"session_token": session_token})
        return None
    
    # Get user
    user_doc = await db.users.find_one({"id": session.user_id})
    if not user_doc:
        return None
    
    return User(**parse_from_mongo(user_doc))

async def require_role(request: Request, allowed_roles: List[UserRole]) -> User:
    """Require user to have one of the allowed roles"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return user

# Auth Routes
@api_router.post("/auth/session", response_model=SessionResponse)
async def create_session(request: SessionRequest, response: Response):
    """Process session_id from OAuth callback"""
    try:
        # Call Emergent Auth API to get session data
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": request.session_id}
            )
            
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session ID")
        
        session_data = auth_response.json()
        
        # Check if user exists, create if not
        user_doc = await db.users.find_one({"email": session_data["email"]})
        
        if not user_doc:
            # Create new user with default role as student (admin can change later)
            new_user = User(
                email=session_data["email"],
                name=session_data["name"],
                picture=session_data.get("picture"),
                role=UserRole.STUDENT  # Default role
            )
            user_dict = prepare_for_mongo(new_user.dict())
            await db.users.insert_one(user_dict)
            user = new_user
        else:
            user = User(**parse_from_mongo(user_doc))
        
        # Create session
        session = UserSession(
            user_id=user.id,
            session_token=session_data["session_token"],
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        
        session_dict = prepare_for_mongo(session.dict())
        await db.sessions.insert_one(session_dict)
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session.session_token,
            max_age=7 * 24 * 60 * 60,  # 7 days
            httponly=True,
            secure=True,
            samesite="none",
            path="/"
        )
        
        return SessionResponse(user=user, session_token=session.session_token)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    user = await get_current_user(request)
    if user:
        # Delete session from database
        session_token = request.cookies.get("session_token")
        if session_token:
            await db.sessions.delete_one({"session_token": session_token})
    
    # Clear cookie
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(request: Request):
    """Get current user info"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

# User Management Routes (Admin only)
@api_router.post("/users", response_model=User)
async def create_user(user_data: CreateUserRequest, request: Request):
    """Create a new user (Admin only)"""
    await require_role(request, [UserRole.ADMIN])
    
    # Check if user already exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = User(**user_data.dict())
    user_dict = prepare_for_mongo(new_user.dict())
    await db.users.insert_one(user_dict)
    
    return new_user

@api_router.get("/users", response_model=List[User])
async def get_users(request: Request):
    """Get all users (Admin only)"""
    await require_role(request, [UserRole.ADMIN])
    
    users = await db.users.find().to_list(1000)
    return [User(**parse_from_mongo(user)) for user in users]

@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: UserRole, request: Request):
    """Update user role (Admin only)"""
    await require_role(request, [UserRole.ADMIN])
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": role.value}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User role updated successfully"}

# Class Management Routes
@api_router.post("/classes", response_model=Class)
async def create_class(class_data: CreateClassRequest, request: Request):
    """Create a new class (Admin only)"""
    await require_role(request, [UserRole.ADMIN])
    
    new_class = Class(**class_data.dict())
    class_dict = prepare_for_mongo(new_class.dict())
    await db.classes.insert_one(class_dict)
    
    return new_class

@api_router.get("/classes", response_model=List[Class])
async def get_classes(request: Request):
    """Get all classes"""
    await get_current_user(request)  # Require authentication
    
    classes = await db.classes.find().to_list(1000)
    return [Class(**parse_from_mongo(cls)) for cls in classes]

@api_router.put("/classes/{class_id}/students")
async def assign_student_to_class(class_id: str, student_id: str, request: Request):
    """Assign student to class (Admin only)"""
    await require_role(request, [UserRole.ADMIN])
    
    # Update class
    await db.classes.update_one(
        {"id": class_id},
        {"$addToSet": {"student_ids": student_id}}
    )
    
    # Update student
    await db.users.update_one(
        {"id": student_id, "role": "student"},
        {"$set": {"class_id": class_id}}
    )
    
    return {"message": "Student assigned to class successfully"}

# Attendance Routes
@api_router.post("/attendance/{class_id}")
async def mark_attendance(class_id: str, attendance_data: BulkAttendanceRequest, request: Request):
    """Mark attendance for a class (Teachers only)"""
    teacher = await require_role(request, [UserRole.TEACHER, UserRole.ADMIN])
    
    # Delete existing attendance for the same date
    await db.attendance.delete_many({
        "class_id": class_id,
        "date": attendance_data.date
    })
    
    # Insert new attendance records
    attendance_records = []
    for record in attendance_data.attendance_records:
        attendance_record = AttendanceRecord(
            student_id=record.student_id,
            class_id=class_id,
            date=attendance_data.date,
            status=record.status,
            notes=record.notes,
            marked_by=teacher.id
        )
        attendance_records.append(prepare_for_mongo(attendance_record.dict()))
    
    if attendance_records:
        await db.attendance.insert_many(attendance_records)
    
    return {"message": "Attendance marked successfully"}

@api_router.get("/attendance/{class_id}")
async def get_class_attendance(class_id: str, date: Optional[str] = None, request: Request):
    """Get attendance for a class"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Authorization check
    if user.role == UserRole.STUDENT:
        # Students can only see their own attendance
        if user.class_id != class_id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif user.role == UserRole.PARENT:
        # Parents can only see their children's attendance
        class_doc = await db.classes.find_one({"id": class_id})
        if not class_doc:
            raise HTTPException(status_code=404, detail="Class not found")
        
        class_obj = Class(**parse_from_mongo(class_doc))
        allowed = any(child_id in class_obj.student_ids for child_id in user.parent_child_ids)
        if not allowed:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Build query
    query = {"class_id": class_id}
    if date:
        query["date"] = date
    
    # Filter by student for student role
    if user.role == UserRole.STUDENT:
        query["student_id"] = user.id
    elif user.role == UserRole.PARENT:
        query["student_id"] = {"$in": user.parent_child_ids}
    
    attendance_records = await db.attendance.find(query).to_list(1000)
    return [AttendanceRecord(**parse_from_mongo(record)) for record in attendance_records]

@api_router.get("/attendance/student/{student_id}")
async def get_student_attendance(student_id: str, request: Request):
    """Get attendance for a specific student"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Authorization check
    if user.role == UserRole.STUDENT and user.id != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    elif user.role == UserRole.PARENT and student_id not in user.parent_child_ids:
        raise HTTPException(status_code=403, detail="Access denied")
    
    attendance_records = await db.attendance.find({"student_id": student_id}).to_list(1000)
    return [AttendanceRecord(**parse_from_mongo(record)) for record in attendance_records]

# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    """Get dashboard statistics"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    stats = {}
    
    if user.role == UserRole.ADMIN:
        # Admin stats
        total_users = await db.users.count_documents({})
        total_classes = await db.classes.count_documents({})
        total_students = await db.users.count_documents({"role": "student"})
        total_teachers = await db.users.count_documents({"role": "teacher"})
        
        stats = {
            "total_users": total_users,
            "total_classes": total_classes,
            "total_students": total_students,
            "total_teachers": total_teachers
        }
    
    elif user.role == UserRole.TEACHER:
        # Teacher stats - classes they teach
        classes = await db.classes.find({"teacher_ids": user.id}).to_list(100)
        total_classes = len(classes)
        total_students = sum(len(cls.get("student_ids", [])) for cls in classes)
        
        stats = {
            "total_classes": total_classes,
            "total_students": total_students
        }
    
    elif user.role == UserRole.STUDENT:
        # Student stats - their attendance
        total_attendance = await db.attendance.count_documents({"student_id": user.id})
        present_count = await db.attendance.count_documents({
            "student_id": user.id,
            "status": "present"
        })
        attendance_percentage = (present_count / total_attendance * 100) if total_attendance > 0 else 0
        
        stats = {
            "total_attendance_records": total_attendance,
            "present_count": present_count,
            "attendance_percentage": round(attendance_percentage, 2)
        }
    
    elif user.role == UserRole.PARENT:
        # Parent stats - children's attendance
        if user.parent_child_ids:
            total_attendance = await db.attendance.count_documents({
                "student_id": {"$in": user.parent_child_ids}
            })
            present_count = await db.attendance.count_documents({
                "student_id": {"$in": user.parent_child_ids},
                "status": "present"
            })
            attendance_percentage = (present_count / total_attendance * 100) if total_attendance > 0 else 0
            
            stats = {
                "children_count": len(user.parent_child_ids),
                "total_attendance_records": total_attendance,
                "present_count": present_count,
                "attendance_percentage": round(attendance_percentage, 2)
            }
        else:
            stats = {"children_count": 0}
    
    return stats

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()