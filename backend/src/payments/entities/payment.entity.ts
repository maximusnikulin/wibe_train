import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

// Тип платежа
export enum PaymentType {
  DEPOSIT = 'deposit', // Пополнение
  WITHDRAWAL = 'withdrawal', // Вывод средств
}

// Статус платежа
export enum PaymentStatus {
  PENDING = 'pending', // Ожидает обработки
  PROCESSING = 'processing', // В процессе обработки
  COMPLETED = 'completed', // Успешно завершён
  FAILED = 'failed', // Ошибка
  CANCELLED = 'cancelled', // Отменён
}

@Entity('payments')
@Index('idx_user_id', ['userId'])
@Index('idx_external_id', ['externalId'])
@Index('idx_status', ['status'])
@Index('idx_type', ['type'])
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: number;

  // Сумма платежа
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  // Валюта платежа
  @Column({ type: 'varchar', length: 3, default: 'RUB' })
  currency: string;

  // Тип платежа
  @Column({
    type: 'enum',
    enum: PaymentType,
  })
  type: PaymentType;

  // Метод оплаты (card, wallet, bank_transfer и т.д.)
  @Column({ name: 'payment_method', type: 'varchar', length: 50 })
  paymentMethod: string;

  // ID платежа из внешней системы (например, Тинькофф)
  @Column({ name: 'external_id', type: 'varchar', length: 255, nullable: true })
  externalId: string;

  // URL страницы оплаты
  @Column({ name: 'payment_url', type: 'text', nullable: true })
  paymentUrl: string;

  // Статус платежа
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  // Дополнительная информация о платеже в формате JSON
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  // Замаскированный номер карты (например, 1234 56** **** 7890)
  @Column({ name: 'card_mask', type: 'varchar', length: 20, nullable: true })
  cardMask: string;

  // Описание ошибки при неудачном платеже
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Связи
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}
