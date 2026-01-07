import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Статус платежа
export enum PaymentStatus {
  PENDING = 'pending', // Ожидает обработки
  COMPLETED = 'completed', // Успешно завершён
  FAILED = 'failed', // Ошибка
  CANCELLED = 'cancelled', // Отменён
}

// Метод платежа
export enum PaymentMethod {
  CARD = 'card', // Банковская карта
  WALLET = 'wallet', // Электронный кошелёк
  BANK_TRANSFER = 'bank_transfer', // Банковский перевод
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  // Сумма платежа (в копейках)
  @Column({ type: 'bigint' })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  // ID транзакции от внешней платёжной системы
  @Column({ nullable: true })
  externalTransactionId: string;

  // ID связанной транзакции в нашей системе
  @Column({ nullable: true })
  transactionId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Связи
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
