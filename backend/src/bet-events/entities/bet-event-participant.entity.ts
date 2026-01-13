import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { BetEvent } from './bet-event.entity';
import { User } from '../../users/entities/user.entity';

@Entity('bet_event_participants')
export class BetEventParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  betEventId: number;

  @Column()
  userId: number;

  // Дополнительная информация об участнике
  @Column({ type: 'text', nullable: true })
  additionalInfo: string;

  @CreateDateColumn()
  createdAt: Date;

  // Связи
  @ManyToOne(() => BetEvent, (betEvent) => betEvent.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'betEventId' })
  betEvent: BetEvent;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;
}
