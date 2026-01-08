import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { Competition } from './entities/competition.entity';
import { CompetitionParticipant } from './entities/competition-participant.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Competition, CompetitionParticipant, User])],
  controllers: [CompetitionsController],
  providers: [CompetitionsService],
  exports: [CompetitionsService], // Экспортируем для использования в других модулях
})
export class CompetitionsModule {}
