import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, requireAuth = true }) => {
  const { currentUser } = useAuth();
  
  // Admin emails list (you can also store this in Firestore)
  const adminEmails = ['imanibraah@gmail.com'];

  if (requireAuth && !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && currentUser && !adminEmails.includes(currentUser.email)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

