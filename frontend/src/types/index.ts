export type UserRole = 'fan' | 'participant';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  balance: string;
}

export interface Competition {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Bet {
  id: number;
  userId: number;
  competitionId: number;
  amount: number;
  prediction: string;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  userId: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  userId: number;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund';
  amount: number;
  description: string;
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
