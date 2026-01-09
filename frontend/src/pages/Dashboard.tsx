import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Dashboard</h1>
        <nav>
          <Link to="/competitions">Competitions</Link>
          <button onClick={logout} className="btn btn-secondary">
            Logout
          </button>
        </nav>
      </header>
      <main className="main-content">
        <div className="welcome-card">
          <h2>Welcome, {user?.firstName}!</h2>
          <p className="balance">Balance: {Number(user?.balance)?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="quick-links">
          <Link to="/competitions" className="card">
            <h3>View Competitions</h3>
            <p>Browse and participate in active competitions</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
