import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Bet, Transaction } from '../types';
import './FanDashboard.css';

interface BalanceResponse {
  balance: string;
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await api.post('/payments/deposit', { amount });
      return response.data;
    },
    onSuccess: (data) => {
      // Редирект на payment_url
      window.open(data.payment_url, '_blank');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка при создании платежа');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amountNum = parseInt(amount); // Конвертируем в копейки

    if (!amount || amountNum < 100) {
      setError('Минимальная сумма пополнения: 100₽');
      return;
    }

    depositMutation.mutate(amountNum);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ПОПОЛНИТЬ БАЛАНС</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="deposit-form">
          <div className="form-group">
            <label>СУММА (₽)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              min="100"
              step="100"
              required
            />
            <p className="form-hint">Минимальная сумма: 100₽</p>
          </div>
          {error && <div className="error-message">{error}</div>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={depositMutation.isPending}
          >
            {depositMutation.isPending ? 'ОБРАБОТКА...' : 'ПОПОЛНИТЬ'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {message}
    </div>
  );
}

export function FanDashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [betFilter, setBetFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Получение баланса
  const { data: balanceData, refetch: refetchBalance } = useQuery<BalanceResponse>({
    queryKey: ['balance'],
    queryFn: async () => {
      const response = await api.get('/users/balance');
      return response.data;
    },
    refetchInterval: 5000, // Обновление каждые 5 секунд
  });

  // Получение ставок
  const { data: bets, isLoading: betsLoading } = useQuery<Bet[]>({
    queryKey: ['bets'],
    queryFn: async () => {
      const response = await api.get('/bets');
      return response.data;
    },
  });

  // Получение транзакций
  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/transactions');
      return response.data;
    },
  });

  // Фильтрация ставок
  const filteredBets = bets?.filter((bet) => {
    const matchesFilter =
      betFilter === 'all' ||
      (betFilter === 'pending' && bet.status === 'pending') ||
      (betFilter === 'won' && bet.status === 'won') ||
      (betFilter === 'lost' && bet.status === 'lost');

    const matchesSearch =
      !searchQuery ||
      bet.betEvent?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bet.participant?.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bet.participant?.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Статистика
  const activeBets = bets?.filter((b) => b.status === 'pending') || [];
  const totalInBets = activeBets.reduce((sum, bet) => sum + bet.amount, 0);
  const wonBets = bets?.filter((b) => b.status === 'won') || [];

  // Проверка статуса платежа после возврата с payment_url
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('payment_id');

    if (paymentId) {
      // Polling для проверки статуса платежа
      const checkPaymentStatus = async () => {
        try {
          const response = await api.get(`/payments/${paymentId}/status`);
          const payment = response.data;

          if (payment.status === 'completed') {
            setToast({ message: 'Баланс успешно пополнен!', type: 'success' });
            refetchBalance();
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            // Очищаем URL
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      };

      // Проверяем сразу и затем каждые 2 секунды
      checkPaymentStatus();
      const interval = setInterval(checkPaymentStatus, 2000);

      // Останавливаем через 30 секунд
      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 30000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [refetchBalance, queryClient]);

  const formatAmount = (kopecks: number) => {
    return kopecks
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return '↑';
      case 'bet':
        return '↓';
      case 'winning':
        return '★';
      case 'refund':
        return '↩';
      default:
        return '•';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
      case 'winning':
        return 'var(--status-success)';
      case 'bet':
        return 'var(--status-danger)';
      case 'refund':
        return 'var(--status-warning)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const balance = balanceData?.balance || user?.balance || '0';

  return (
    <div className="fan-dashboard">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>ЛИЧНЫЙ КАБИНЕТ</h1>
          <span className="user-name">{user?.firstName} {user?.lastName}</span>
        </div>
        <nav className="header-nav">
          <Link to="/bet-events" className="nav-link">
            СОБЫТИЯ
          </Link>
          <button onClick={logout} className="btn btn-secondary">
            ВЫХОД
          </button>
        </nav>
      </header>

      <main className="dashboard-main">
        {/* Статистика и баланс */}
        <div className="stats-grid">
          {/* Виджет баланса */}
          <div className="balance-widget">
            <div className="balance-label">БАЛАНС</div>
            <div className="balance-amount">{formatAmount(Number(balance))} ₽</div>
            <button
              onClick={() => setDepositModalOpen(true)}
              className="btn btn-primary brutal-btn"
            >
              ПОПОЛНИТЬ
            </button>
          </div>

          {/* Статистика ставок */}
          <div className="stats-widget">
            <div className="stat-item">
              <div className="stat-label">АКТИВНЫЕ СТАВКИ</div>
              <div className="stat-value">{activeBets.length}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">В СТАВКАХ</div>
              <div className="stat-value">{formatAmount(totalInBets)} ₽</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">ВЫИГРАНО</div>
              <div className="stat-value stat-value-won">{wonBets.length}</div>
            </div>
          </div>
        </div>

        {/* Мои ставки */}
        <section className="bets-section">
          <div className="section-header">
            <h2>МОИ СТАВКИ</h2>
            <div className="section-controls">
              <input
                type="text"
                placeholder="ПОИСК..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${betFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setBetFilter('all')}
                >
                  ВСЕ
                </button>
                <button
                  className={`filter-btn ${betFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setBetFilter('pending')}
                >
                  ОЖИДАНИЕ
                </button>
                <button
                  className={`filter-btn ${betFilter === 'won' ? 'active' : ''}`}
                  onClick={() => setBetFilter('won')}
                >
                  ВЫИГРАНО
                </button>
                <button
                  className={`filter-btn ${betFilter === 'lost' ? 'active' : ''}`}
                  onClick={() => setBetFilter('lost')}
                >
                  ПРОИГРАНО
                </button>
              </div>
            </div>
          </div>

          {betsLoading ? (
            <div className="loading-skeleton">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          ) : filteredBets && filteredBets.length > 0 ? (
            <div className="bets-grid">
              {filteredBets.map((bet) => (
                <div key={bet.id} className="bet-card">
                  <div className="bet-header">
                    <h3>{bet.betEvent?.title || 'Событие'}</h3>
                    <span className={`bet-status bet-status-${bet.status}`}>
                      {bet.status === 'pending' && 'ОЖИДАНИЕ'}
                      {bet.status === 'won' && 'ВЫИГРАНО'}
                      {bet.status === 'lost' && 'ПРОИГРАНО'}
                      {bet.status === 'cancelled' && 'ОТМЕНЕНО'}
                    </span>
                  </div>
                  <div className="bet-info">
                    <div className="bet-detail">
                      <span className="bet-label">СТАВКА:</span>
                      <span className="bet-value">{formatAmount(bet.amount)} ₽</span>
                    </div>
                    <div className="bet-detail">
                      <span className="bet-label">НА УЧАСТНИКА:</span>
                      <span className="bet-value">
                        {bet.participant?.user?.firstName} {bet.participant?.user?.lastName}
                      </span>
                    </div>
                    <div className="bet-detail">
                      <span className="bet-label">ДАТА:</span>
                      <span className="bet-value">
                        {new Date(bet.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/bet-events/${bet.betEventId}`}
                    className="bet-link"
                  >
                    ПЕРЕЙТИ К СОБЫТИЮ →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>НЕТ СТАВОК</p>
            </div>
          )}
        </section>

        {/* История транзакций */}
        <section className="transactions-section">
          <h2>ИСТОРИЯ ТРАНЗАКЦИЙ</h2>
          {transactionsLoading ? (
            <div className="loading-skeleton">
              <div className="skeleton-row"></div>
              <div className="skeleton-row"></div>
              <div className="skeleton-row"></div>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="transactions-table">
              <div className="table-header">
                <div className="table-col">ТИП</div>
                <div className="table-col">СУММА</div>
                <div className="table-col">ОПИСАНИЕ</div>
                <div className="table-col">ДАТА</div>
              </div>
              {transactions.map((transaction) => (
                <div key={transaction.id} className="table-row">
                  <div className="table-col">
                    <span
                      className="transaction-icon"
                      style={{ color: getTransactionColor(transaction.type) }}
                    >
                      {getTransactionIcon(transaction.type)}
                    </span>
                    <span className="transaction-type">
                      {transaction.type === 'deposit' && 'ПОПОЛНЕНИЕ'}
                      {transaction.type === 'bet' && 'СТАВКА'}
                      {transaction.type === 'winning' && 'ВЫИГРЫШ'}
                      {transaction.type === 'refund' && 'ВОЗВРАТ'}
                    </span>
                  </div>
                  <div
                    className="table-col transaction-amount"
                    style={{ color: getTransactionColor(transaction.type) }}
                  >
                    {transaction.type === 'deposit' || transaction.type === 'winning' || transaction.type === 'refund'
                      ? '+'
                      : '-'}
                    {formatAmount(transaction.amount)} ₽
                  </div>
                  <div className="table-col transaction-description">
                    {transaction.description}
                  </div>
                  <div className="table-col transaction-date">
                    {new Date(transaction.createdAt).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>НЕТ ТРАНЗАКЦИЙ</p>
            </div>
          )}
        </section>
      </main>

      {/* Модальное окно пополнения */}
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
      />
    </div>
  );
}
