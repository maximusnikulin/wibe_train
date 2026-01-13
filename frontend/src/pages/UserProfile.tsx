import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface PublicUserProfile {
    firstName: string;
    lastName: string;
}

export function UserProfile() {
    const { id } = useParams<{ id: string }>();

    const { data: user, isLoading, error } = useQuery<PublicUserProfile>({
        queryKey: ['userProfile', id],
        queryFn: async () => {
            const response = await api.get(`/users/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Загрузка...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Ошибка</h2>
                <p>Пользователь не найден</p>
                <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>
                    На главную
                </Link>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>
                    ← На главную
                </Link>
            </div>

            <div style={{
                backgroundColor: '#fff',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ marginBottom: '1rem' }}>Профиль пользователя</h1>

                {user && (
                    <div>
                        <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                            <strong>Имя:</strong> {user.firstName}
                        </p>
                        <p style={{ fontSize: '1.2rem' }}>
                            <strong>Фамилия:</strong> {user.lastName}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
