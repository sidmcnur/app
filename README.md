# SM Joshi School Attendance Management System

A comprehensive web-based attendance management system built for educational institutions, featuring role-based access control, real-time attendance tracking, and Google OAuth authentication.

## 🚀 Features

### Multi-Role Dashboard System
- **Admin Dashboard** 👑 - Complete system management and oversight
- **Teacher Dashboard** 👩‍🏫 - Class management and attendance tracking
- **Student Dashboard** 👨‍🎓 - Personal attendance viewing and analytics
- **Parent Dashboard** 👨‍👩‍👧‍👦 - Children's attendance monitoring

### Core Functionality
- **Google OAuth Integration** - Secure authentication with Google accounts
- **Real-time Attendance Tracking** - Mark and view attendance instantly
- **Role-based Access Control** - Secure permissions for different user types
- **Class Management** - Organize students into classes with teacher assignments
- **Attendance Analytics** - View attendance statistics and trends
- **User Management** - Admin tools for managing users and permissions

### Attendance Features
- Multiple attendance statuses (Present, Absent, Late, Excused, Medical)
- Bulk attendance marking for entire classes
- Date-wise attendance reports
- Student-specific attendance history
- Parent access to children's attendance records

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 19 + TypeScript with modern UI components
- **Backend**: FastAPI (Python) with async support
- **Database**: MongoDB for flexible data storage
- **Authentication**: Google OAuth 2.0 via Emergent Agent platform
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context API

### Project Structure
```
app/
├── backend/                    # FastAPI backend application
│   ├── server.py              # Main FastAPI application
│   ├── start_server.py        # Server startup script
│   ├── make_admin.py          # Admin user management utility
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend environment variables
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── AdminDashboard.js
│   │   │   ├── TeacherDashboard.js
│   │   │   ├── StudentDashboard.js
│   │   │   ├── ParentDashboard.js
│   │   │   ├── LoginPage.js
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utility functions
│   ├── package.json          # Node.js dependencies
│   └── .env                  # Frontend environment variables
├── tests/                    # Test files and test utilities
├── test_reports/            # Generated test reports
├── ADMIN_SETUP.md           # Admin setup instructions
└── backend_test.py          # API testing utility
```

## 🛠️ Setup & Installation

### Prerequisites
- **Python 3.8+** with pip
- **Node.js 16+** with npm/yarn
- **MongoDB** (local installation or cloud instance)
- **Google Cloud Console** account (for OAuth setup)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   Create `.env` file in the backend directory:
   ```env
   MONGO_URL="mongodb://localhost:27017"
   DB_NAME="attendance_system"
   CORS_ORIGINS="http://localhost:3000"
   ```

4. **Start MongoDB:**
   ```bash
   # For local MongoDB installation
   mongod
   
   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start the backend server:**
   ```bash
   python start_server.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**
   Create `.env` file in the frontend directory:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8000
   WDS_SOCKET_PORT=443
   ```

4. **Start the development server:**
   ```bash
   npm start
   # or
   yarn start
   ```
   The application will be available at `http://localhost:3000`

## 👑 Admin Setup

The first user needs to be promoted to admin status manually. See [ADMIN_SETUP.md](./ADMIN_SETUP.md) for detailed instructions.

**Quick Admin Setup:**
1. Login with Google OAuth (you'll be assigned 'student' role initially)
2. Run the admin promotion script:
   ```bash
   cd backend
   python make_admin.py your-email@gmail.com
   ```
3. Logout and login again to access admin features

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/session` - Create user session from OAuth
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/logout` - Logout current user

### User Management (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/{user_id}/role` - Update user role

### Class Management
- `GET /api/classes` - List all classes
- `POST /api/classes` - Create new class (Admin only)
- `PUT /api/classes/{class_id}/students` - Assign student to class (Admin only)

### Attendance Management
- `POST /api/attendance/{class_id}` - Mark attendance for class (Teachers/Admin)
- `GET /api/attendance/{class_id}` - Get class attendance records
- `GET /api/attendance/student/{student_id}` - Get student attendance history

### Dashboard & Analytics
- `GET /api/dashboard/stats` - Get role-specific dashboard statistics

Interactive API documentation is available at `http://localhost:8000/docs` when the server is running.

## 🎯 Usage Guide

### For Administrators
1. **User Management**: Create and manage user accounts, assign roles
2. **Class Organization**: Set up classes, assign teachers and students
3. **System Oversight**: Monitor attendance statistics and system usage
4. **Role Management**: Promote users to different roles as needed

### For Teachers
1. **Attendance Marking**: Mark daily attendance for assigned classes
2. **Class Reports**: View attendance reports and analytics
3. **Student Management**: View student lists and attendance history

### For Students
1. **Attendance Viewing**: Check personal attendance records
2. **Analytics**: View attendance percentage and trends
3. **Profile Management**: Update personal information

### For Parents
1. **Children Monitoring**: View attendance for assigned children
2. **Reports**: Access attendance reports and statistics
3. **Notifications**: Receive attendance-related updates

## 🧪 Testing

### Backend API Testing
Run the comprehensive API test suite:
```bash
python backend_test.py
```

This tests:
- Authentication endpoints
- User management functionality
- Class management operations
- Attendance tracking features
- Authorization and security
- CORS configuration

### Frontend Testing
```bash
cd frontend
npm test
# or
yarn test
```

### Manual Testing Checklist
- [ ] Google OAuth login flow
- [ ] Role-based dashboard access
- [ ] Attendance marking functionality
- [ ] User and class management
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
MONGO_URL=mongodb://localhost:27017          # MongoDB connection string
DB_NAME=attendance_system                    # Database name
CORS_ORIGINS=http://localhost:3000          # Allowed CORS origins
```

**Frontend (.env):**
```env
REACT_APP_BACKEND_URL=http://localhost:8000  # Backend API URL
WDS_SOCKET_PORT=443                          # WebSocket port for dev server
```

### Database Schema
The system uses MongoDB with the following collections:
- `users` - User accounts and profile information
- `sessions` - User authentication sessions
- `classes` - Class definitions and assignments
- `attendance` - Attendance records and history

## 🚀 Deployment

### Production Deployment Checklist
1. **Environment Setup**:
   - Set production MongoDB connection
   - Configure production CORS origins
   - Set up SSL certificates
   - Configure environment variables

2. **Security Hardening**:
   - Enable HTTPS only
   - Set secure cookie flags
   - Configure proper CORS policies
   - Set up rate limiting

3. **Performance Optimization**:
   - Enable API response caching
   - Optimize database queries
   - Configure CDN for static assets
   - Set up monitoring and logging

### Docker Deployment (Optional)
```bash
# Build and run with docker-compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Authentication Issues:**
- Ensure Google OAuth is properly configured
- Check that session cookies are being set correctly
- Verify CORS settings allow credentials

**Database Connection:**
- Confirm MongoDB is running and accessible
- Check connection string in environment variables
- Verify database permissions

**Frontend/Backend Communication:**
- Ensure both servers are running on correct ports
- Check API endpoints are properly configured
- Verify CORS settings

### Getting Help
- Check the [ADMIN_SETUP.md](./ADMIN_SETUP.md) for setup issues
- Review API documentation at `/docs` endpoint
- Check browser console for frontend errors
- Review server logs for backend issues

## 📊 System Requirements

### Minimum Requirements
- **RAM**: 4GB
- **Storage**: 1GB free space
- **Network**: Stable internet connection for OAuth
- **Browser**: Modern browser with JavaScript enabled

### Recommended Requirements
- **RAM**: 8GB or more
- **Storage**: 5GB free space
- **Database**: Dedicated MongoDB instance
- **Network**: High-speed internet connection
