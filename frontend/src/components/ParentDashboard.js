import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { toast } from 'sonner';
import axios from 'axios';

const ParentDashboard = () => {
  const { user, logout, API } = useContext(AuthContext);
  const [stats, setStats] = useState({});
  const [childrenAttendance, setChildrenAttendance] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchChildren();
    fetchChildrenAttendance();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildAttendance(selectedChild.id);
    }
  }, [selectedChild]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch statistics');
    }
  };

  const fetchChildren = async () => {
    try {
      // Get all users and filter children based on parent_child_ids
      const response = await axios.get(`${API}/users`);
      const allUsers = response.data;
      const userChildren = allUsers.filter(u => 
        user.parent_child_ids && user.parent_child_ids.includes(u.id)
      );
      setChildren(userChildren);
      
      if (userChildren.length > 0 && !selectedChild) {
        setSelectedChild(userChildren[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch children information');
    }
  };

  const fetchChildrenAttendance = async () => {
    if (!user.parent_child_ids || user.parent_child_ids.length === 0) return;
    
    setLoading(true);
    try {
      // Fetch attendance for all children
      const attendancePromises = user.parent_child_ids.map(childId =>
        axios.get(`${API}/attendance/student/${childId}`)
      );
      
      const responses = await Promise.all(attendancePromises);
      const allAttendance = responses.flatMap(response => response.data);
      
      // Sort by date (newest first)
      const sortedAttendance = allAttendance.sort((a, b) => new Date(b.date) - new Date(a.date));
      setChildrenAttendance(sortedAttendance);
    } catch (error) {
      toast.error('Failed to fetch children attendance');
    }
    setLoading(false);
  };

  const fetchChildAttendance = async (childId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/attendance/student/${childId}`);
      const sortedAttendance = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setChildrenAttendance(sortedAttendance);
    } catch (error) {
      toast.error('Failed to fetch child attendance');
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

  const getChildName = (studentId) => {
    const child = children.find(c => c.id === studentId);
    return child ? child.name : 'Unknown Student';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-2xl font-bold text-white">Rakesh School - Parent Dashboard</h1>
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
            <div className="stat-title">Children</div>
            <div className="stat-value" data-testid="children-count">{stats.children_count || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Overall Attendance</div>
            <div className="stat-value" data-testid="overall-attendance">{stats.attendance_percentage || 0}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Total Present Days</div>
            <div className="stat-value" data-testid="total-present">{stats.present_count || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Total Records</div>
            <div className="stat-value" data-testid="total-records">{stats.total_attendance_records || 0}</div>
          </div>
        </div>

        {children.length > 0 && (
          <div className="data-table">
            <div className="table-header">
              <h3 className="text-lg font-bold">Select Child</h3>
            </div>
            <div className="p-6">
              <div className="form-group">
                <label className="form-label">View attendance for:</label>
                <select
                  className="form-select"
                  value={selectedChild?.id || ''}
                  onChange={(e) => {
                    const child = children.find(c => c.id === e.target.value);
                    setSelectedChild(child);
                  }}
                  data-testid="child-select"
                >
                  <option value="">All Children</option>
                  {children.map(child => (
                    <option key={child.id} value={child.id}>
                      {child.name} ({child.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="data-table">
          <div className="table-header">
            <h3 className="text-lg font-bold">
              Attendance History
              {selectedChild && ` - ${selectedChild.name}`}
            </h3>
            <p className="text-sm opacity-70 mt-2">
              {selectedChild ? 
                `Showing attendance records for ${selectedChild.name}` : 
                'Showing attendance records for all children'
              }
            </p>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-gray-500">Loading attendance records...</p>
              </div>
            ) : childrenAttendance.length > 0 ? (
              <div className="space-y-3">
                {childrenAttendance.map((record, index) => (
                  <div 
                    key={record.id || index} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    data-testid={`attendance-record-${index}`}
                  >
                    <div>
                      <div className="font-medium">{formatDate(record.date)}</div>
                      {!selectedChild && (
                        <div className="text-sm text-blue-600 font-medium">
                          {getChildName(record.student_id)}
                        </div>
                      )}
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
                <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
                <p className="text-lg font-medium">No attendance records found</p>
                <p className="text-sm">
                  {children.length === 0 ? 
                    'No children assigned to your account. Please contact admin.' :
                    'Attendance records will appear here once teachers start marking them.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Children Information */}
        {children.length > 0 && (
          <div className="data-table">
            <div className="table-header">
              <h3 className="text-lg font-bold">Your Children</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {children.map((child) => (
                  <div 
                    key={child.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    data-testid={`child-info-${child.id}`}
                  >
                    <div>
                      <div className="font-medium">{child.name}</div>
                      <div className="text-sm text-gray-500">{child.email}</div>
                      {child.student_id && (
                        <div className="text-sm text-blue-600">Student ID: {child.student_id}</div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {child.class_id ? 'Assigned to class' : 'No class assigned'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Parent Guidelines */}
        <div className="data-table">
          <div className="table-header">
            <h3 className="text-lg font-bold">Parent Guidelines</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-blue-700">Monitoring Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check attendance daily</li>
                  <li>• Communicate with teachers for absences</li>
                  <li>• Ensure children arrive on time</li>
                  <li>• Set attendance goals with your child</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-green-700">Communication</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Notify school of planned absences</li>
                  <li>• Provide medical certificates when needed</li>
                  <li>• Contact teachers for attendance concerns</li>
                  <li>• Maintain regular school communication</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;