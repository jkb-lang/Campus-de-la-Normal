import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { user, profile, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Comprobando credenciales autorizadas..." />;
  }

  // Not authenticated
  if (!user && !profile) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/panel" replace />;
  }

  return children;
};
