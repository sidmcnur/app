import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { toast } from 'sonner';
import axios from 'axios';

const AdminDashboard = () => {
  const { user, logout, API } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Forms state
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'student',
    student_id: '',
    parent_child_ids: [],
    class_id: ''
  });

  const [newClass, setNewClass] = useState({
    name: '',
    division: '',
    stream: '',
    grade: '12'
  });

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'classes') {
      fetchClasses();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch statistics');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API}/classes`);
      setClasses(response.data);
    } catch (error) {
      toast.error('Failed to fetch classes');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/users`, newUser);
      toast.success('User created successfully');
      setNewUser({
        email: '',
        name: '',
        role: 'student',
        student_id: '',
        parent_child_ids: [],
        class_id: ''
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
    
    setLoading(false);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/classes`, newClass);
      toast.success('Class created successfully');
      setNewClass({
        name: '',
        division: '',
        stream: '',
        grade: '12'
      });
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create class');
    }
    
    setLoading(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`${API}/users/${userId}/role?role=${newRole}`);
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleAssignStudent = async (classId, studentId) => {
    try {
      await axios.put(`${API}/classes/${classId}/students?student_id=${studentId}`);
      toast.success('Student assigned to class successfully');
      fetchClasses();
    } catch (error) {
      toast.error('Failed to assign student to class');
    }
  };

  const renderDashboardTab = () => (
    <div className="space-y-6">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Users</div>
          <div className="stat-value">{stats.total_users || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Classes</div>
          <div className="stat-value">{stats.total_classes || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Students</div>
          <div className="stat-value">{stats.total_students || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Teachers</div>
          <div className="stat-value">{stats.total_teachers || 0}</div>
        </div>
      </div>
      
      <div className="data-table">
        <div className="table-header">
          <h3 className="text-lg font-bold">System Overview</h3>
          <p className="text-sm opacity-70 mt-2">
            Welcome to SM Joshi Attendance Management System. Use the tabs above to manage users and classes.
          </p>
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="data-table">
        <div className="table-header">
          <h3 className="text-lg font-bold">Create New User</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
                data-testid="create-user-email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                required
                data-testid="create-user-name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                data-testid="create-user-role"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Student ID (if student)</label>
              <input
                type="text"
                className="form-input"
                value={newUser.student_id}
                onChange={(e) => setNewUser({...newUser, student_id: e.target.value})}
                data-testid="create-user-student-id"
              />
            </div>
            <div className="col-span-full">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                data-testid="create-user-submit"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="data-table">
        <div className="table-header">
          <h3 className="text-lg font-bold">All Users ({users.length})</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`user-row-${user.id}`}>
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'student' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {user.role}
                  </span>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="form-select text-sm"
                    data-testid={`user-role-select-${user.id}`}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderClassesTab = () => (
    <div className="space-y-6">
      <div className="data-table">
        <div className="table-header">
          <h3 className="text-lg font-bold">Create New Class</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleCreateClass} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Class Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 12-A Commerce"
                value={newClass.name}
                onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                required
                data-testid="create-class-name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Division</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., A"
                value={newClass.division}
                onChange={(e) => setNewClass({...newClass, division: e.target.value})}
                required
                data-testid="create-class-division"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stream</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Commerce, Science"
                value={newClass.stream}
                onChange={(e) => setNewClass({...newClass, stream: e.target.value})}
                required
                data-testid="create-class-stream"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Grade</label>
              <input
                type="text"
                className="form-input"
                value={newClass.grade}
                onChange={(e) => setNewClass({...newClass, grade: e.target.value})}
                required
                data-testid="create-class-grade"
              />
            </div>
            <div className="col-span-full">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                data-testid="create-class-submit"
              >
                {loading ? 'Creating...' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="data-table">
        <div className="table-header">
          <h3 className="text-lg font-bold">All Classes ({classes.length})</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {classes.map((classObj) => (
              <div key={classObj.id} className="p-4 bg-gray-50 rounded-lg" data-testid={`class-row-${classObj.id}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-lg">{classObj.name}</div>
                    <div className="text-sm text-gray-500">
                      Division: {classObj.division} | Stream: {classObj.stream} | Grade: {classObj.grade}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {classObj.student_ids?.length || 0} students
                  </div>
                </div>
                
                <div className="mt-3">
                  <h4 className="font-medium text-sm mb-2">Assign Student to Class:</h4>
                  <div className="flex gap-2">
                    <select
                      className="form-select text-sm flex-1"
                      onChange={(e) => e.target.value && handleAssignStudent(classObj.id, e.target.value)}
                      defaultValue=""
                      data-testid={`assign-student-select-${classObj.id}`}
                    >
                      <option value="">Select a student...</option>
                      {users.filter(u => u.role === 'student').map(student => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-2xl font-bold text-white">SM Joshi - Admin Dashboard</h1>
            <p className="text-white opacity-70">Welcome back, {user.name}</p>
          </div>
          <button
            onClick={logout}
            className="btn btn-secondary"
            data-testid="logout-button"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            data-testid="dashboard-tab"
          >
            Dashboard
          </button>
          <button
            className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            data-testid="users-tab"
          >
            Users
          </button>
          <button
            className={`nav-tab ${activeTab === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveTab('classes')}
            data-testid="classes-tab"
          >
            Classes
          </button>
        </div>

        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'classes' && renderClassesTab()}
      </div>
    </div>
  );
};

export default AdminDashboard;