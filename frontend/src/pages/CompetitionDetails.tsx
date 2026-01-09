import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Competition } from '../types';

export function CompetitionDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: competition, isLoading, error } = useQuery<Competition>({
    queryKey: ['competition', id],
    queryFn: async () => {
      const response = await api.get(`/competitions/${id}`);
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="loading">Loading competition...</div>;
  }

  if (error || !competition) {
    return <div className="error-message">Failed to load competition</div>;
  }

  return (
    <div className="competition-details">
      <header className="header">
        <Link to="/competitions" className="btn btn-secondary">
          Back to Competitions
        </Link>
      </header>
      <main className="main-content">
        <div className="competition-info">
          <h1>{competition.title}</h1>
          <span className={`status status-${competition.status}`}>
            {competition.status}
          </span>
          <p className="description">{competition.description}</p>
          <div className="dates">
            <p>
              <strong>Start:</strong>{' '}
              {new Date(competition.startDate).toLocaleDateString()}
            </p>
            <p>
              <strong>End:</strong>{' '}
              {new Date(competition.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
