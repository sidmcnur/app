import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import axios from 'axios';
import './App.css';

// Configure axios to include credentials (cookies) in all requests
axios.defaults.withCredentials = true;

// Import components
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';
import LoadingScreen from './components/LoadingScreen';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for session on app load
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Handle session_id from URL fragment
  useEffect(() => {
    const handleSessionId = async () => {
      const hash = window.location.hash;
      if (hash.includes('session_id=')) {
        setLoading(true);
        const sessionId = hash.split('session_id=')[1].split('&')[0];
        
        try {
          const response = await axios.post(`${API}/auth/session`, {
            session_id: sessionId
          });
          
          setUser(response.data.user);
          
          // Clear URL fragment
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('Session creation failed:', error);
        }
        setLoading(false);
      }
    };

    handleSessionId();
  }, []);

  const checkExistingSession = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.log('No existing session');
    }
    setLoading(false);
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const authValue = {
    user,
    setUser,
    logout,
    API
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const renderDashboard = () => {
    if (!user) return <LoginPage />;

    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'parent':
        return <ParentDashboard />;
      default:
        return <LoginPage />;
    }
  };

  return (
    <AuthContext.Provider value={authValue}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={renderDashboard()} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </AuthContext.Provider>
  );
}

export default App;