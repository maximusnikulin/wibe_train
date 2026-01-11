import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Bet } from '../../bets/entities/bet.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

// Типы пользователей: болельщик или участник
export enum UserRole {
  FAN = 'fan', // Болельщик
  PARTICIPANT = 'participant', // Участник состязания
  ADMIN = "admin"
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Хешированный пароль

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.FAN,
  })
  role: UserRole;

  // Баланс пользователя (целое число, без копеек)
  @Column({ type: 'int', default: 0 })
  balance: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Связи
  @OneToMany(() => Bet, (bet) => bet.user)
  bets: Bet[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @Column({ default: false })
  isAdmin: false
}
