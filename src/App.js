// src/App.js
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
import PartnersPage from './pages/PartnersPage'; // NEU: Kooperationen
import InstagramPage from './pages/InstagramPage'; // NEU: Instagram Post Generator

// Auth Context
const AuthContext = React.createContext(null);

export function useAuth() {
  return React.useContext(AuthContext);
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = sessionStorage.getItem('superadmin_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('superadmin_auth', 'true');
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('superadmin_auth');
  };

  if (isLoading) {
    return <LoadingScreen>Laden...</LoadingScreen>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      <GlobalStyles />
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1A1A1A', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }
      }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          } />
          <Route path="/" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute><ProjectsPage /></ProtectedRoute>
          } />
          <Route path="/projects/new" element={
            <ProtectedRoute><NewProjectPage /></ProtectedRoute>
          } />
          <Route path="/projects/:id" element={
            <ProtectedRoute><ProjectDetailPage /></ProtectedRoute>
          } />
          <Route path="/partners" element={
            <ProtectedRoute><PartnersPage /></ProtectedRoute>
          } />
          <Route path="/instagram" element={
            <ProtectedRoute><InstagramPage /></ProtectedRoute>
          } />
          <Route path="/requests" element={
            <ProtectedRoute><RequestsPage /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute><SettingsPage /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

const LoadingScreen = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-family: 'Inter', sans-serif;
`;

export default App;
