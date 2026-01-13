import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BetEventParticipant } from './bet-event-participant.entity';
import { Bet } from '../../bets/entities/bet.entity';

// Статус события
export enum BetEventStatus {
  UPCOMING = 'upcoming', // Предстоящее
  ACTIVE = 'active', // Активное (идёт)
  FINISHED = 'finished', // Завершённое
  CANCELLED = 'cancelled', // Отменённое
}

@Entity('bet_events')
export class BetEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: BetEventStatus,
    default: BetEventStatus.UPCOMING,
  })
  status: BetEventStatus;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate: Date;

  // ID победителя (null пока не определён)
  @Column({ nullable: true })
  winnerId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Связи
  @OneToMany(() => BetEventParticipant, (participant) => participant.betEvent)
  participants: BetEventParticipant[];

  @OneToMany(() => Bet, (bet) => bet.betEvent)
  bets: Bet[];
}
