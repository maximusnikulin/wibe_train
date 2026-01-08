import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { Bet } from './entities/bet.entity';
import { UsersModule } from '../users/users.module';
import { CompetitionsModule } from '../competitions/competitions.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bet]),
    UsersModule,
    forwardRef(() => CompetitionsModule), // forwardRef для избежания циклической зависимости
    forwardRef(() => TransactionsModule), // forwardRef для избежания циклической зависимости
  ],
  controllers: [BetsController],
  providers: [BetsService],
  exports: [BetsService],
})
export class BetsModule {}
