import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { Competition } from './entities/competition.entity';
import { CompetitionParticipant } from './entities/competition-participant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Competition, CompetitionParticipant])],
  controllers: [CompetitionsController],
  providers: [CompetitionsService],
  exports: [CompetitionsService], // Экспортируем для использования в других модулях
})
export class CompetitionsModule {}
