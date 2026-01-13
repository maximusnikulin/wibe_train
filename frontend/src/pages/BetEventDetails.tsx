import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { BetEvent } from '../types';

export function BetEventDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: betEvent, isLoading, error } = useQuery<BetEvent>({
    queryKey: ['betEvent', id],
    queryFn: async () => {
      const response = await api.get(`/bet-events/${id}`);
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="loading">Loading event...</div>;
  }

  if (error || !betEvent) {
    return <div className="error-message">Failed to load event</div>;
  }

  return (
    <div className="bet-event-details">
      <header className="header">
        <Link to="/bet-events" className="btn btn-secondary">
          Back to Events
        </Link>
      </header>
      <main className="main-content">
        <div className="bet-event-info">
          <h1>{betEvent.title}</h1>
          <span className={`status status-${betEvent.status}`}>
            {betEvent.status}
          </span>
          <p className="description">{betEvent.description}</p>
          <div className="dates">
            <p>
              <strong>Start:</strong>{' '}
              {new Date(betEvent.startDate).toLocaleDateString()}
            </p>
            <p>
              <strong>End:</strong>{' '}
              {new Date(betEvent.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
