// src/App.js - SI Wedding SuperAdmin
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import styled from 'styled-components';
import GlobalStyles from './styles/GlobalStyles';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import RequestsPage from './pages/RequestsPage';
import NewProjectPage from './pages/NewProjectPage';
import SettingsPage from './pages/SettingsPage';
import PartnersPage from './pages/PartnersPage';
import InstagramPage from './pages/InstagramPage';
import ReelsPage from './pages/ReelsPage';
import ContentPage from './pages/ContentPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Auth Context
const AuthContext = React.createContext(null);

export function useAuth() {
  return React.useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for saved auth
    const savedUser = localStorage.getItem('si_admin_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('si_admin_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const userToStore = userData || { loggedIn: true };
    setUser(userToStore);
    localStorage.setItem('si_admin_user', JSON.stringify(userToStore));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('si_admin_user');
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  // Check localStorage directly as fallback (handles timing issues)
  const hasAuth = user || localStorage.getItem('si_admin_user');
  return hasAuth ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <GlobalStyles />
      <Toaster position="top-right" />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute><ProjectsPage /></PrivateRoute>} />
          <Route path="/projects/new" element={<PrivateRoute><NewProjectPage /></PrivateRoute>} />
          <Route path="/projects/:id" element={<PrivateRoute><ProjectDetailPage /></PrivateRoute>} />
          <Route path="/requests" element={<PrivateRoute><RequestsPage /></PrivateRoute>} />
          <Route path="/partners" element={<PrivateRoute><PartnersPage /></PrivateRoute>} />
          <Route path="/content" element={<PrivateRoute><ContentPage /></PrivateRoute>} />
          <Route path="/instagram" element={<PrivateRoute><ContentPage /></PrivateRoute>} />
          <Route path="/reels" element={<PrivateRoute><ContentPage /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
