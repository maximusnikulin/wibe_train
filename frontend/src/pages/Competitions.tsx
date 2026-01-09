import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Competition } from '../types';

export function Competitions() {
  const { data: competitions, isLoading, error } = useQuery<Competition[]>({
    queryKey: ['competitions'],
    queryFn: async () => {
      const response = await api.get('/competitions');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="loading">Loading competitions...</div>;
  }

  if (error) {
    return <div className="error-message">Failed to load competitions</div>;
  }

  return (
    <div className="competitions-page">
      <header className="header">
        <h1>Competitions</h1>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </header>
      <main className="main-content">
        <div className="competitions-list">
          {competitions?.length === 0 ? (
            <p>No competitions available</p>
          ) : (
            competitions?.map((competition) => (
              <Link
                to={`/competitions/${competition.id}`}
                key={competition.id}
                className="competition-card"
              >
                <h3>{competition.title}</h3>
                <p>{competition.description}</p>
                <div className="competition-meta">
                  <span className={`status status-${competition.status}`}>
                    {competition.status}
                  </span>
                  <span className="date">
                    {new Date(competition.startDate).toLocaleDateString()} -{' '}
                    {new Date(competition.endDate).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
