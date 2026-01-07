import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Payment } from './payment.entity';

// Тип транзакции
export enum TransactionType {
  DEPOSIT = 'deposit', // Пополнение счёта
  BET = 'bet', // Ставка (списание)
  WINNING = 'winning', // Выигрыш (начисление)
  REFUND = 'refund', // Возврат
  BET_REFUND = 'bet_refund', // Возврат при неудачном выводе
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  // Сумма транзакции (в копейках)
  @Column({ type: 'bigint' })
  amount: number;

  // Баланс после транзакции
  @Column({ type: 'bigint' })
  balanceAfter: number;

  // Описание транзакции
  @Column({ type: 'text', nullable: true })
  description: string;

  // ID связанной ставки (если применимо)
  @Column({ nullable: true })
  betId: number;

  // ID связанного платежа (если применимо)
  @Column({ name: 'payment_id', nullable: true })
  paymentId: number;

  @CreateDateColumn()
  createdAt: Date;

  // Связи
  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;
}
