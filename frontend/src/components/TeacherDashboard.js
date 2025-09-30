import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { toast } from 'sonner';
import axios from 'axios';

const TeacherDashboard = () => {
  const { user, logout, API } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'attendance') {
      fetchClasses();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents();
      fetchExistingAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch statistics');
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API}/classes`);
      setClasses(response.data);
      if (response.data.length > 0 && !selectedClass) {
        setSelectedClass(response.data[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch classes');
    }
  };

  const fetchClassStudents = async () => {
    if (!selectedClass) return;
    
    try {
      // Fetch all users and filter students in this class
      const response = await axios.get(`${API}/users`);
      const allUsers = response.data;
      const classStudents = allUsers.filter(user => 
        user.role === 'student' && user.class_id === selectedClass.id
      );
      setStudents(classStudents);
      
      // Initialize attendance state for all students
      const initialAttendance = {};
      classStudents.forEach(student => {
        initialAttendance[student.id] = 'present'; // Default to present
      });
      setAttendance(initialAttendance);
    } catch (error) {
      toast.error('Failed to fetch students');
    }
  };

  const fetchExistingAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    
    try {
      const response = await axios.get(`${API}/attendance/${selectedClass.id}?date=${selectedDate}`);
      const existingAttendance = {};
      
      response.data.forEach(record => {
        existingAttendance[record.student_id] = record.status;
      });
      
      // Update attendance state with existing records
      setAttendance(prev => ({
        ...prev,
        ...existingAttendance
      }));
    } catch (error) {
      // No existing attendance is okay
      console.log('No existing attendance found');
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      toast.error('Please select a class and date');
      return;
    }

    setLoading(true);
    
    try {
      const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        status: status,
        notes: null
      }));

      await axios.post(`${API}/attendance/${selectedClass.id}`, {
        class_id: selectedClass.id,
        date: selectedDate,
        attendance_records: attendanceRecords
      });

      toast.success('Attendance marked successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to mark attendance');
    }
    
    setLoading(false);
  };

  const renderDashboardTab = () => (
    <div className="space-y-6">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Classes</div>
          <div className="stat-value">{stats.total_classes || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Students</div>
          <div className="stat-value">{stats.total_students || 0}</div>
        </div>
      </div>
      
      <div className="data-table">
        <div className="table-header">
          <h3 className="text-lg font-bold">Teacher Dashboard</h3>
          <p className="text-sm opacity-70 mt-2">
            Welcome {user.name}! Use the Attendance tab to mark daily attendance for your classes.
          </p>
        </div>
      </div>
    </div>
  );

  const renderAttendanceTab = () => (
    <div className="space-y-6">
      <div className="data-table">
        <div className="table-header">
          <h3 className="text-lg font-bold">Mark Attendance</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Select Class</label>
              <select
                className="form-select"
                value={selectedClass?.id || ''}
                onChange={(e) => {
                  const classObj = classes.find(c => c.id === e.target.value);
                  setSelectedClass(classObj);
                }}
                data-testid="class-select"
              >
                <option value="">Select a class...</option>
                {classes.map(classObj => (
                  <option key={classObj.id} value={classObj.id}>
                    {classObj.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                data-testid="date-select"
              />
            </div>
          </div>

          {selectedClass && students.length > 0 && (
            <>
              <div className="mt-6">
                <h4 className="font-medium text-lg mb-4">
                  Students in {selectedClass.name} - {selectedDate}
                </h4>
                <div className="attendance-grid">
                  {students.map(student => (
                    <div key={student.id} className="student-attendance-row" data-testid={`student-attendance-${student.id}`}>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                      <div className="attendance-status">
                        {['present', 'absent', 'late', 'excused', 'medical'].map(status => (
                          <button
                            key={status}
                            className={`status-btn ${attendance[student.id] === status ? 'active' : ''}`}
                            onClick={() => handleAttendanceChange(student.id, status)}
                            data-testid={`${student.id}-${status}`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmitAttendance}
                  className="btn btn-primary"
                  disabled={loading}
                  data-testid="submit-attendance"
                >
                  {loading ? 'Saving...' : 'Mark Attendance'}
                </button>
              </div>
            </>
          )}

          {selectedClass && students.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No students found in this class. Please contact admin to assign students.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-2xl font-bold text-white">SM Joshi - Teacher Dashboard</h1>
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
            className={`nav-tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
            data-testid="attendance-tab"
          >
            Mark Attendance
          </button>
        </div>

        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'attendance' && renderAttendanceTab()}
      </div>
    </div>
  );
};

export default TeacherDashboard;