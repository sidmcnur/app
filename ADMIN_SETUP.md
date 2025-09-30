# Admin Setup Instructions for SM Joshi School Attendance System

## How to Login as Admin

Since the system uses Google OAuth for authentication, here's how to become an admin:

### Step 1: First Login
1. Open the application at `http://localhost:3000`
2. Click "Continue with Google"
3. Complete the Google OAuth flow
4. You will be logged in as a **Student** (default role)
5. Note your email address from the login

### Step 2: Make Yourself Admin
After your first login, you need to be promoted to admin:

```bash
# Navigate to the backend directory
cd /Users/sidhu-mac/Documents/Projects/Attendance_System/app/backend

# Run the admin tool to make yourself admin (replace with your email)
/Users/sidhu-mac/.venv/bin/python make_admin.py your-email@gmail.com

# Or list all users to see who's in the system
/Users/sidhu-mac/.venv/bin/python make_admin.py --list
```

### Step 3: Login as Admin
1. After being promoted to admin, logout from the application
2. Login again with Google using the same email
3. You will now see the **Admin Dashboard** instead of Student Dashboard

## Admin Capabilities

As an admin, you can:
- **Manage Users**: Create new users, change user roles (Student → Teacher, etc.)
- **Manage Classes**: Create and organize classes
- **View System Statistics**: Total users, classes, students, teachers
- **Assign Students to Classes**: Organize the school structure
- **Assign Teachers to Classes**: Manage teaching assignments

## Creating Other Admins

Once you're an admin, you can promote other users through the web interface:
1. Go to the Admin Dashboard
2. Use the "Users" tab to manage user roles
3. Change any user's role to "Admin"

## User Roles in the System

1. **Admin** 👑 - Full system access
2. **Teacher** 👩‍🏫 - Can mark attendance, view class reports
3. **Student** 👨‍🎓 - Can view their own attendance
4. **Parent** 👨‍👩‍👧‍👦 - Can view their children's attendance

## Troubleshooting

If you can't login or get redirected back to the login page:
1. Make sure the backend server is running on `http://localhost:8000`
2. Make sure MongoDB is running
3. Check the browser console for any errors
4. Clear browser cookies and try again

## Security Note

In a production environment, you would:
1. Create the first admin user through a secure setup process
2. Use environment variables for admin email addresses
3. Implement proper role-based access control
4. Use HTTPS for all communications