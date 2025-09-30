#!/usr/bin/env python3
"""
Script to make a user an admin by email address
Usage: python make_admin.py user@example.com
"""
import sys
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def make_admin(email):
    """Make a user admin by email"""
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    try:
        # Find user by email
        user = await db.users.find_one({"email": email})
        
        if not user:
            print(f"❌ User with email '{email}' not found.")
            print("The user must log in at least once before being made an admin.")
            return False
        
        # Update user role to admin
        result = await db.users.update_one(
            {"email": email},
            {"$set": {"role": "admin"}}
        )
        
        if result.modified_count > 0:
            print(f"✅ Successfully made '{email}' an admin!")
            print(f"User: {user.get('name', 'Unknown')} ({email})")
            return True
        else:
            print(f"❌ Failed to update user role for '{email}'")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        client.close()

async def list_users():
    """List all users in the system"""
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    try:
        users = await db.users.find().to_list(1000)
        
        if not users:
            print("No users found in the database.")
            return
        
        print("\n📋 Current Users:")
        print("-" * 60)
        for user in users:
            role_emoji = {
                'admin': '👑',
                'teacher': '👩‍🏫',
                'student': '👨‍🎓',
                'parent': '👨‍👩‍👧‍👦'
            }.get(user.get('role', 'unknown'), '❓')
            
            print(f"{role_emoji} {user.get('name', 'Unknown')} ({user.get('email', 'No email')})")
            print(f"   Role: {user.get('role', 'unknown')}")
            print()
            
    except Exception as e:
        print(f"❌ Error listing users: {e}")
    finally:
        client.close()

async def main():
    if len(sys.argv) < 2:
        print("🔧 SM Joshi School - Admin Management Tool")
        print("=" * 50)
        print("\nUsage:")
        print("  python make_admin.py <email>        - Make user admin")
        print("  python make_admin.py --list         - List all users")
        print("\nExample:")
        print("  python make_admin.py user@example.com")
        print("\nNote: The user must log in at least once before being made an admin.")
        return
    
    if sys.argv[1] == "--list":
        await list_users()
    else:
        email = sys.argv[1]
        await make_admin(email)

if __name__ == "__main__":
    asyncio.run(main())