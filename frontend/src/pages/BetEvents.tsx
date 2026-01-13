import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { BetEvent } from '../types';

export function BetEvents() {
  const { data: betEvents, isLoading, error } = useQuery<BetEvent[]>({
    queryKey: ['betEvents'],
    queryFn: async () => {
      const response = await api.get('/bet-events');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="loading">Loading events...</div>;
  }

  if (error) {
    return <div className="error-message">Failed to load events</div>;
  }

  return (
    <div className="bet-events-page">
      <header className="header">
        <h1>События</h1>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </header>
      <main className="main-content">
        <div className="bet-events-list">
          {betEvents?.length === 0 ? (
            <p>No events available</p>
          ) : (
            betEvents?.map((betEvent) => (
              <Link
                to={`/bet-events/${betEvent.id}`}
                key={betEvent.id}
                className="bet-event-card"
              >
                <h3>{betEvent.title}</h3>
                <p>{betEvent.description}</p>
                <div className="bet-event-meta">
                  <span className={`status status-${betEvent.status}`}>
                    {betEvent.status}
                  </span>
                  <span className="date">
                    {new Date(betEvent.startDate).toLocaleDateString()} -{' '}
                    {new Date(betEvent.endDate).toLocaleDateString()}
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
