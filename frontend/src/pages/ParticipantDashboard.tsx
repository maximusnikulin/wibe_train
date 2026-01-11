import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Transaction, Competition } from '../types';
import './ParticipantDashboard.css';

interface BalanceResponse {
  balance: string;
}

interface ParticipantCompetition extends Competition {
  participantId: number;
  betsOnMe: number;
  totalBetsAmount: number;
  potentialWinning: number;
  place?: number;
}

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onSuccess: () => void;
}

// Validation helpers
function validateCardNumber(cardNumber: string): boolean {
  const digitsOnly = cardNumber.replace(/\s/g, '');
  return /^\d{16,19}$/.test(digitsOnly);
}

function formatCardInput(value: string): string {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 19);
  const groups = digitsOnly.match(/.{1,4}/g);
  return groups ? groups.join(' ') : '';
}

function WithdrawalModal({ isOpen, onClose, balance, onSuccess }: WithdrawalModalProps) {
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [error, setError] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [payoutId, setPayoutId] = useState<number | null>(null);

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; cardNumber: string }) => {
      const response = await api.post('/payments/withdraw', data);
      return response.data;
    },
    onSuccess: (data) => {
      setPayoutId(data.payout_id);
      setIsPolling(true);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка при создании выплаты');
    },
  });

  // Polling for payout status
  useEffect(() => {
    if (!isPolling || !payoutId) return;

    const checkStatus = async () => {
      try {
        const response = await api.get(`/payments/${payoutId}/status`);
        const payment = response.data;

        if (payment.status === 'completed') {
          setIsPolling(false);
          onSuccess();
          onClose();
        } else if (payment.status === 'failed') {
          setIsPolling(false);
          setError(payment.errorMessage || 'Выплата отклонена');
        }
      } catch (err) {
        console.error('Error checking payout status:', err);
      }
    };

    const interval = setInterval(checkStatus, 2000);
    const timeout = setTimeout(() => {
      setIsPolling(false);
      clearInterval(interval);
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isPolling, payoutId, onSuccess, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseInt(amount);
    const cardDigits = cardNumber.replace(/\s/g, '');

    if (!amount || amountNum < 100) {
      setError('Минимальная сумма вывода: 100 руб.');
      return;
    }

    if (amountNum > balance) {
      setError('Недостаточно средств на счете');
      return;
    }

    if (!validateCardNumber(cardNumber)) {
      setError('Введите корректный номер карты (16-19 цифр)');
      return;
    }

    withdrawMutation.mutate({
      amount: amountNum,
      cardNumber: cardDigits,
    });
  };

  const handleCardInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardInput(e.target.value));
  };

  const handleClose = () => {
    if (!isPolling) {
      setAmount('');
      setCardNumber('');
      setError('');
      setPayoutId(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ВЫВОД СРЕДСТВ</h2>
          {!isPolling && (
            <button className="modal-close" onClick={handleClose}>
              ×
            </button>
          )}
        </div>

        {isPolling ? (
          <div className="withdrawal-processing">
            <div className="processing-spinner"></div>
            <p>ОБРАБОТКА ВЫПЛАТЫ...</p>
            <p className="processing-hint">Пожалуйста, подождите</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="withdrawal-form">
            <div className="form-group">
              <label>СУММА (руб.)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                min="100"
                max={balance}
                required
              />
              <p className="form-hint">
                Доступно: {balance} руб. | Минимум: 100 руб.
              </p>
            </div>
            <div className="form-group">
              <label>НОМЕР КАРТЫ</label>
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardInput}
                placeholder="0000 0000 0000 0000"
                maxLength={23}
                required
              />
              <p className="form-hint">Введите 16-19 цифр номера карты</p>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? 'ОБРАБОТКА...' : 'ВЫВЕСТИ'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return <div className={`toast toast-${type}`}>{message}</div>;
}

export function ParticipantDashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [competitionFilter, setCompetitionFilter] = useState<
    'all' | 'active' | 'completed'
  >('all');

  // Получение баланса
  const { data: balanceData, refetch: refetchBalance } =
    useQuery<BalanceResponse>({
      queryKey: ['balance'],
      queryFn: async () => {
        const response = await api.get('/users/balance');
        return response.data;
      },
      refetchInterval: 5000,
    });

  // Получение состязаний участника
  const { data: competitions, isLoading: competitionsLoading } = useQuery<
    ParticipantCompetition[]
  >({
    queryKey: ['participant-competitions'],
    queryFn: async () => {
      const response = await api.get('/competitions/my-participations');
      return response.data;
    },
  });

  // Получение транзакций (для истории выплат)
  const { data: transactions, isLoading: transactionsLoading } = useQuery<
    Transaction[]
  >({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/transactions');
      return response.data;
    },
  });

  // Фильтрация состязаний
  const filteredCompetitions = competitions?.filter((comp) => {
    if (competitionFilter === 'all') return true;
    if (competitionFilter === 'active')
      return comp.status === 'active' || comp.status === 'upcoming';
    if (competitionFilter === 'completed')
      return comp.status === 'completed' || comp.status === 'cancelled';
    return true;
  });

  // Статистика
  const activeCompetitions =
    competitions?.filter(
      (c) => c.status === 'active' || c.status === 'upcoming'
    ) || [];
  const completedCompetitions =
    competitions?.filter((c) => c.status === 'completed') || [];
  const wins = completedCompetitions.filter((c) => c.place === 1).length;
  const totalEarnings =
    transactions
      ?.filter((t) => t.type === 'winning')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

  // Фильтр транзакций - только выигрыши и выводы
  const paymentHistory = transactions?.filter(
    (t) => t.type === 'winning' || t.type === 'bet_refund'
  );

  const balance = Number(balanceData?.balance || user?.balance || 0);

  const getStatusLabel = (status: Competition['status']) => {
    switch (status) {
      case 'upcoming':
        return 'СКОРО';
      case 'active':
        return 'АКТИВНО';
      case 'completed':
        return 'ЗАВЕРШЕНО';
      case 'cancelled':
        return 'ОТМЕНЕНО';
      default:
        return status;
    }
  };

  const getTransactionTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'winning':
        return 'ВЫИГРЫШ';
      case 'bet_refund':
        return 'ВОЗВРАТ';
      default:
        return type.toUpperCase();
    }
  };

  const handleWithdrawSuccess = () => {
    setToast({ message: 'Средства успешно выведены!', type: 'success' });
    refetchBalance();
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  return (
    <div className="participant-dashboard">
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
          <h1>ЛИЧНЫЙ КАБИНЕТ УЧАСТНИКА</h1>
          <span className="user-name">
            {user?.firstName} {user?.lastName}
          </span>
        </div>
        <nav className="header-nav">
          <Link to="/competitions" className="nav-link">
            СОСТЯЗАНИЯ
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
            <div className="balance-amount">{balance} руб.</div>
            <button
              onClick={() => setWithdrawModalOpen(true)}
              className="btn btn-primary brutal-btn"
              disabled={balance < 100}
            >
              ВЫВЕСТИ
            </button>
          </div>

          {/* Статистика состязаний */}
          <div className="stats-widget">
            <div className="stat-item">
              <div className="stat-label">АКТИВНЫЕ СОСТЯЗАНИЯ</div>
              <div className="stat-value">{activeCompetitions.length}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">ЗАВЕРШЁННЫЕ</div>
              <div className="stat-value">{completedCompetitions.length}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">ПОБЕД</div>
              <div className="stat-value stat-value-won">{wins}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">ОБЩИЙ ЗАРАБОТОК</div>
              <div className="stat-value stat-value-won">{totalEarnings} руб.</div>
            </div>
          </div>
        </div>

        {/* Мои состязания */}
        <section className="competitions-section">
          <div className="section-header">
            <h2>МОИ СОСТЯЗАНИЯ</h2>
            <div className="section-controls">
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${competitionFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCompetitionFilter('all')}
                >
                  ВСЕ
                </button>
                <button
                  className={`filter-btn ${competitionFilter === 'active' ? 'active' : ''}`}
                  onClick={() => setCompetitionFilter('active')}
                >
                  АКТИВНЫЕ
                </button>
                <button
                  className={`filter-btn ${competitionFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setCompetitionFilter('completed')}
                >
                  ЗАВЕРШЁННЫЕ
                </button>
              </div>
            </div>
          </div>

          {competitionsLoading ? (
            <div className="loading-skeleton">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          ) : filteredCompetitions && filteredCompetitions.length > 0 ? (
            <div className="competitions-grid">
              {filteredCompetitions.map((comp) => (
                <div key={comp.id} className="competition-card">
                  <div className="competition-header">
                    <h3>{comp.title}</h3>
                    <span className={`competition-status status-${comp.status}`}>
                      {getStatusLabel(comp.status)}
                    </span>
                  </div>
                  <div className="competition-info">
                    <div className="competition-detail">
                      <span className="detail-label">СТАВОК НА МЕНЯ:</span>
                      <span className="detail-value">
                        {comp.betsOnMe} ({comp.totalBetsAmount} руб.)
                      </span>
                    </div>
                    <div className="competition-detail">
                      <span className="detail-label">ВОЗМОЖНЫЙ ВЫИГРЫШ:</span>
                      <span className="detail-value potential-win">
                        {comp.potentialWinning} руб.
                      </span>
                    </div>
                    {comp.place && (
                      <div className="competition-detail">
                        <span className="detail-label">МЕСТО:</span>
                        <span
                          className={`detail-value ${comp.place === 1 ? 'place-first' : ''}`}
                        >
                          {comp.place === 1 ? '1 МЕСТО' : `${comp.place} МЕСТО`}
                        </span>
                      </div>
                    )}
                    <div className="competition-detail">
                      <span className="detail-label">ДАТА:</span>
                      <span className="detail-value">
                        {new Date(comp.startDate).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                  <Link to={`/competitions/${comp.id}`} className="competition-link">
                    ПОДРОБНЕЕ →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>НЕТ СОСТЯЗАНИЙ</p>
            </div>
          )}
        </section>

        {/* История выплат */}
        <section className="transactions-section">
          <h2>ИСТОРИЯ ВЫПЛАТ</h2>
          {transactionsLoading ? (
            <div className="loading-skeleton">
              <div className="skeleton-row"></div>
              <div className="skeleton-row"></div>
              <div className="skeleton-row"></div>
            </div>
          ) : paymentHistory && paymentHistory.length > 0 ? (
            <div className="transactions-table">
              <div className="table-header">
                <div className="table-col">ТИП</div>
                <div className="table-col">СУММА</div>
                <div className="table-col">ОПИСАНИЕ</div>
                <div className="table-col">ДАТА</div>
              </div>
              {paymentHistory.map((transaction) => (
                <div key={transaction.id} className="table-row">
                  <div className="table-col">
                    <span
                      className={`transaction-icon ${transaction.type === 'winning' ? 'icon-winning' : 'icon-refund'}`}
                    >
                      {transaction.type === 'winning' ? '★' : '↩'}
                    </span>
                    <span className="transaction-type">
                      {getTransactionTypeLabel(transaction.type)}
                    </span>
                  </div>
                  <div className="table-col transaction-amount amount-positive">
                    +{transaction.amount} руб.
                  </div>
                  <div className="table-col transaction-description">
                    {transaction.description}
                  </div>
                  <div className="table-col transaction-date">
                    {new Date(transaction.createdAt).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>НЕТ ВЫПЛАТ</p>
            </div>
          )}
        </section>
      </main>

      {/* Модальное окно вывода */}
      <WithdrawalModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        balance={balance}
        onSuccess={handleWithdrawSuccess}
      />
    </div>
  );
}
