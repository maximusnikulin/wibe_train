export type UserRole = 'fan' | 'participant' | 'admin';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  balance: string;
}

export interface BetEvent {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'finished' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Bet {
  id: number;
  userId: number;
  betEventId: number;
  participantId: number;
  amount: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  betEvent?: BetEvent;
  participant?: {
    id: number;
    userId: number;
    user?: User;
    additionalInfo?: string;
  };
}

export interface Payment {
  id: number;
  userId: number;
  amount: number;
  type: 'deposit' | 'withdrawal';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentUrl?: string;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositResponse {
  payment_id: number;
  payment_url: string;
  amount: number;
}

export interface Transaction {
  id: number;
  userId: number;
  type: 'deposit' | 'bet' | 'winning' | 'refund' | 'bet_refund';
  amount: number;
  balanceAfter: number;
  description: string;
  betId?: number;
  paymentId?: number;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
