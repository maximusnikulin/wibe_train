import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Competition } from '../../competitions/entities/competition.entity';
import { CompetitionParticipant } from '../../competitions/entities/competition-participant.entity';

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
  competitionId: number;

  @Column()
  participantId: number;

  // Сумма ставки (в копейках)
  @Column({ type: 'bigint' })
  amount: number;

  // Коэффициент на момент ставки
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  odds: number;

  // Потенциальный выигрыш (amount * odds)
  @Column({ type: 'bigint' })
  potentialWinning: number;

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

  @ManyToOne(() => Competition, (competition) => competition.bets)
  @JoinColumn({ name: 'competitionId' })
  competition: Competition;

  @ManyToOne(() => CompetitionParticipant, { eager: true })
  @JoinColumn({ name: 'participantId' })
  participant: CompetitionParticipant;
}
