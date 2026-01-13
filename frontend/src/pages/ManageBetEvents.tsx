import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { BetEvent } from '../types';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface BetEventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'finished' | 'cancelled';
  participantsIds: number[];
}

export function ManageBetEvents() {
  const queryClient = useQueryClient();
  const [editingEvent, setEditingEvent] = useState<BetEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BetEventFormData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'upcoming',
    participantsIds: [],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Получение списка событий
  const { data: events, isLoading: eventsLoading } = useQuery<BetEvent[]>({
    queryKey: ['betEvents'],
    queryFn: async () => {
      const response = await api.get('/bet-events');
      return response.data;
    },
  });

  // Получение списка участников
  const { data: participants, isLoading: participantsLoading } = useQuery<User[]>({
    queryKey: ['participants'],
    queryFn: async () => {
      const response = await api.get('/users/participants');
      return response.data;
    },
  });

  // Получение участников конкретного события
  const { data: eventParticipants } = useQuery<{ id: number; userId: number }[]>({
    queryKey: ['eventParticipants', editingEvent?.id],
    queryFn: async () => {
      if (!editingEvent) return [];
      const response = await api.get(`/bet-events/${editingEvent.id}/participants`);
      return response.data;
    },
    enabled: !!editingEvent,
  });

  // Создание события
  const createMutation = useMutation({
    mutationFn: async (data: BetEventFormData) => {
      const response = await api.post('/bet-events', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['betEvents'] });
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'upcoming',
        participantsIds: [],
      });
      setSuccess('Событие успешно создано');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка при создании события');
      setSuccess('');
    },
  });

  // Обновление события
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BetEventFormData> }) => {
      const response = await api.patch(`/bet-events/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['betEvents'] });
      queryClient.invalidateQueries({ queryKey: ['eventParticipants'] });
      setEditingEvent(null);
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'upcoming',
        participantsIds: [],
      });
      setSuccess('Событие успешно обновлено');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка при обновлении события');
      setSuccess('');
    },
  });

  // Удаление события
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/bet-events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['betEvents'] });
      setSuccess('Событие успешно удалено');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка при удалении события');
      setSuccess('');
    },
  });

  const handleEdit = async (event: BetEvent) => {
    setEditingEvent(event);
    setShowForm(true);
    setError('');
    setSuccess('');
    
    // Загружаем участников события
    try {
      const response = await api.get(`/bet-events/${event.id}/participants`);
      const participants = response.data;
      setFormData({
        title: event.title,
        description: event.description,
        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
        status: event.status as 'upcoming' | 'active' | 'finished' | 'cancelled',
        participantsIds: participants.map((p: { userId: number }) => p.userId) || [],
      });
    } catch (err) {
      setFormData({
        title: event.title,
        description: event.description,
        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
        status: event.status as 'upcoming' | 'active' | 'finished' | 'cancelled',
        participantsIds: [],
      });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить это событие?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const submitData = {
      title: formData.title,
      description: formData.description,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      status: formData.status,
      participantsIds: formData.participantsIds,
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'upcoming',
      participantsIds: [],
    });
    setError('');
    setSuccess('');
  };

  const handleParticipantToggle = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      participantsIds: prev.participantsIds.includes(userId)
        ? prev.participantsIds.filter(id => id !== userId)
        : [...prev.participantsIds, userId],
    }));
  };

  if (eventsLoading || participantsLoading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="manage-events-page" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header className="header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Управление событиями</h1>
        <div>
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingEvent(null);
                setFormData({
                  title: '',
                  description: '',
                  startDate: '',
                  endDate: '',
                  status: 'upcoming',
                  participantsIds: [],
                });
                setError('');
                setSuccess('');
              }}
              className="btn btn-primary"
              style={{ marginRight: '1rem' }}
            >
              Создать событие
            </button>
          )}
          <Link to="/" className="btn btn-secondary">
            На главную
          </Link>
        </div>
      </header>

      {error && (
        <div className="error-message" style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#fee', color: '#c33', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#efe', color: '#3c3', borderRadius: '4px' }}>
          {success}
        </div>
      )}

      {showForm && (
        <div className="event-form" style={{ backgroundColor: '#f9f9f9', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <h2>{editingEvent ? 'Редактировать событие' : 'Создать новое событие'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Название *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Описание *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label htmlFor="startDate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Дата начала *
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Дата окончания
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="status" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Статус
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="upcoming">Предстоящее</option>
                <option value="active">Активное</option>
                <option value="finished">Завершённое</option>
                <option value="cancelled">Отменённое</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Участники
              </label>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '0.5rem' }}>
                {participants && participants.length > 0 ? (
                  participants.map((participant) => (
                    <label
                      key={participant.id}
                      style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.participantsIds.includes(participant.id)}
                        onChange={() => handleParticipantToggle(participant.id)}
                        style={{ marginRight: '0.5rem' }}
                      />
                      <span>
                        {participant.firstName} {participant.lastName} ({participant.email})
                      </span>
                    </label>
                  ))
                ) : (
                  <p style={{ padding: '0.5rem', color: '#666' }}>Нет доступных участников</p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Сохранение...'
                  : editingEvent
                  ? 'Сохранить изменения'
                  : 'Создать событие'}
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="events-list">
        <h2>Список событий</h2>
        {events && events.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>Название</th>
                <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>Статус</th>
                <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>Дата начала</th>
                <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>Дата окончания</th>
                <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td style={{ padding: '1rem', border: '1px solid #ddd' }}>{event.id}</td>
                  <td style={{ padding: '1rem', border: '1px solid #ddd' }}>{event.title}</td>
                  <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                    <span className={`status status-${event.status}`}>
                      {event.status === 'upcoming' && 'Предстоящее'}
                      {event.status === 'active' && 'Активное'}
                      {event.status === 'finished' && 'Завершённое'}
                      {event.status === 'cancelled' && 'Отменённое'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                    {new Date(event.startDate).toLocaleString('ru-RU')}
                  </td>
                  <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                    {event.endDate ? new Date(event.endDate).toLocaleString('ru-RU') : '-'}
                  </td>
                  <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(event)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="btn"
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.875rem',
                          backgroundColor: '#dc3545',
                          color: '#fff',
                          border: 'none',
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Нет событий</p>
        )}
      </div>
    </div>
  );
}
