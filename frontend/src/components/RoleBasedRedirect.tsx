import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RoleBasedRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Redirect based on user role
  if (user.role === 'participant') {
    return <Navigate to="/participant-dashboard" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }

  // Default to fan dashboard (for 'fan' role or any other)
  return <Navigate to="/fan-dashboard" replace />;
}
