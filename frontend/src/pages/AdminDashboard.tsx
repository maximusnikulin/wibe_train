import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AdminDashboard() {
    const { user, logout } = useAuth();

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>ЛИЧНЫЙ КАБИНЕТ</h1>
                    <span className="user-name">{user?.firstName} {user?.lastName}</span>
                </div>
                <nav className="header-nav">
                    <Link to="/manage-events" className="nav-link">
                        УПРАВЛЕНИЕ СОБЫТИЯМИ
                    </Link>
                    <button onClick={logout} className="btn btn-secondary">
                        ВЫХОД
                    </button>
                </nav>
            </header>

            {/* Main Content */}
            <main style={{ padding: '2rem', textAlign: 'center' }}>
                <h1>Admin here !!!</h1>
            </main>
        </div>
    );
}
