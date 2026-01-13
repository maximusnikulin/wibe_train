import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Login';

export function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  // Редиректим в зависимости от роли
  if (user.role === 'participant') {
    return <Navigate to="/participant-dashboard" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }

  // Для fan и admin редиректим на fan-dashboard
  return <Navigate to="/fan-dashboard" replace />;
}
