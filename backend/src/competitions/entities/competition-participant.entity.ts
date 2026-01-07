import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Competition } from './competition.entity';
import { User } from '../../users/entities/user.entity';

@Entity('competition_participants')
export class CompetitionParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  competitionId: number;

  @Column()
  userId: number;

  // Коэффициент ставки на этого участника (например, 2.5)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1.0 })
  odds: number;

  // Дополнительная информация об участнике
  @Column({ type: 'text', nullable: true })
  additionalInfo: string;

  @CreateDateColumn()
  createdAt: Date;

  // Связи
  @ManyToOne(() => Competition, (competition) => competition.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'competitionId' })
  competition: Competition;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;
}
