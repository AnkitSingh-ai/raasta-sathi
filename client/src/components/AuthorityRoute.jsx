import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AuthorityRoute({ children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has authority role (not citizen)
  if (user?.role === 'citizen') {
    // Citizens cannot access authority pages
    return <Navigate to="/" replace />;
  }

  // Allow access for police, municipal, service_provider roles
  return <>{children}</>;
}