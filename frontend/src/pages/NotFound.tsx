import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function NotFound() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (isAuthenticated) {
      navigate('/');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '6rem', margin: '0', color: '#333' }}>404</h1>
        <h2 style={{ marginTop: '1rem', marginBottom: '1rem' }}>Page Not Found</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button onClick={handleGoHome} className="btn btn-primary">
          Go Home
        </button>
        {isAuthenticated && (
          <p style={{ marginTop: '1.5rem' }}>
            <Link to="/competitions" style={{ color: '#007bff', textDecoration: 'none' }}>
              Browse Competitions
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
