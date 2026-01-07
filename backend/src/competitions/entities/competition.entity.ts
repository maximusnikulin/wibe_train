import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CompetitionParticipant } from './competition-participant.entity';
import { Bet } from '../../bets/entities/bet.entity';

// Статус состязания
export enum CompetitionStatus {
  UPCOMING = 'upcoming', // Предстоящее
  ACTIVE = 'active', // Активное (идёт)
  FINISHED = 'finished', // Завершённое
  CANCELLED = 'cancelled', // Отменённое
}

@Entity('competitions')
export class Competition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: CompetitionStatus,
    default: CompetitionStatus.UPCOMING,
  })
  status: CompetitionStatus;

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
  @OneToMany(() => CompetitionParticipant, (participant) => participant.competition)
  participants: CompetitionParticipant[];

  @OneToMany(() => Bet, (bet) => bet.competition)
  bets: Bet[];
}
