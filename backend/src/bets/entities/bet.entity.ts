import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BetEvent } from '../../bet-events/entities/bet-event.entity';
import { BetEventParticipant } from '../../bet-events/entities/bet-event-participant.entity';

// Статус ставки
export enum BetStatus {
  PENDING = 'pending', // Ожидает результата
  WON = 'won', // Выиграла
  LOST = 'lost', // Проиграла
  CANCELLED = 'cancelled', // Отменена
}

@Entity('bets')
export class Bet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  betEventId: number;

  @Column()
  participantId: number;

  // Сумма ставки (в копейках)
  @Column({ type: 'bigint' })
  amount: number;

  @Column({
    type: 'enum',
    enum: BetStatus,
    default: BetStatus.PENDING,
  })
  status: BetStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Связи
  @ManyToOne(() => User, (user) => user.bets)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => BetEvent, (betEvent) => betEvent.bets)
  @JoinColumn({ name: 'betEventId' })
  betEvent: BetEvent;

  @ManyToOne(() => BetEventParticipant, { eager: true })
  @JoinColumn({ name: 'participantId' })
  participant: BetEventParticipant;
}
