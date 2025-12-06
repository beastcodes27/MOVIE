import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Home from './components/Home';
import Contact from './components/Contact';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement';
import './App.css';

function AppLayout() {
  return (
    <>
      <Sidebar />
      <PageContent />
    </>
  );
}

function PageContent() {
  return (
    <div className="page-wrapper">
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />
        <Route
          path="/movies"
          element={<Home />}
        />
        <Route
          path="/contact"
          element={<Contact />}
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly={true}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SidebarProvider>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<AppLayout />} />
            </Routes>
          </div>
        </SidebarProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
