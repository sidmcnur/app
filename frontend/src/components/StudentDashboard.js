import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { toast } from 'sonner';
import axios from 'axios';

const StudentDashboard = () => {
  const { user, logout, API } = useContext(AuthContext);
  const [stats, setStats] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchAttendance();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch statistics');
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/attendance/student/${user.id}`);
      // Sort by date (newest first)
      const sortedAttendance = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAttendance(sortedAttendance);
    } catch (error) {
      toast.error('Failed to fetch attendance records');
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'excused':
        return 'bg-blue-100 text-blue-800';
      case 'medical':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAttendancePercentage = () => {
    if (!stats.total_attendance_records || stats.total_attendance_records === 0) return 0;
    return Math.round((stats.present_count / stats.total_attendance_records) * 100);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-2xl font-bold text-white">SM Joshi - Student Dashboard</h1>
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
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-title">Attendance Percentage</div>
            <div className="stat-value" data-testid="attendance-percentage">{getAttendancePercentage()}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Total Records</div>
            <div className="stat-value" data-testid="total-records">{stats.total_attendance_records || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Present Days</div>
            <div className="stat-value" data-testid="present-days">{stats.present_count || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Absent Days</div>
            <div className="stat-value" data-testid="absent-days">
              {(stats.total_attendance_records || 0) - (stats.present_count || 0)}
            </div>
          </div>
        </div>

        <div className="data-table">
          <div className="table-header">
            <h3 className="text-lg font-bold">Attendance History</h3>
            <p className="text-sm opacity-70 mt-2">Your complete attendance record</p>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-gray-500">Loading attendance records...</p>
              </div>
            ) : attendance.length > 0 ? (
              <div className="space-y-3">
                {attendance.map((record, index) => (
                  <div 
                    key={record.id || index} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    data-testid={`attendance-record-${index}`}
                  >
                    <div>
                      <div className="font-medium">{formatDate(record.date)}</div>
                      <div className="text-sm text-gray-500">
                        Marked at: {new Date(record.marked_at).toLocaleTimeString()}
                      </div>
                      {record.notes && (
                        <div className="text-sm text-gray-600 mt-1">
                          Note: {record.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500" data-testid="no-attendance-message">
                <div className="text-4xl mb-4">📅</div>
                <p className="text-lg font-medium">No attendance records found</p>
                <p className="text-sm">Your attendance will appear here once teachers start marking it</p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Tips */}
        <div className="data-table">
          <div className="table-header">
            <h3 className="text-lg font-bold">Attendance Guidelines</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-green-700">Good Attendance Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Aim for 95% or higher attendance</li>
                  <li>• Arrive to class on time</li>
                  <li>• Notify teachers if you'll be absent</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-blue-700">Status Meanings</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <span className="font-medium text-green-600">Present:</span> On time attendance</li>
                  <li>• <span className="font-medium text-yellow-600">Late:</span> Arrived after class started</li>
                  <li>• <span className="font-medium text-blue-600">Excused:</span> Pre-approved absence</li>
                  <li>• <span className="font-medium text-purple-600">Medical:</span> Medical leave</li>
                  <li>• <span className="font-medium text-red-600">Absent:</span> Did not attend</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;