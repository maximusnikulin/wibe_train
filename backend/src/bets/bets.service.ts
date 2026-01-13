import {Injectable, BadRequestException, NotFoundException, Inject, forwardRef} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bet, BetStatus } from './entities/bet.entity';
import { CreateBetDto } from './dto/create-bet.dto';
import { UsersService } from '../users/users.service';
import { BetEventsService } from '../bet-events/bet-events.service';
import { TransactionsService } from '../transactions/transactions.service';
import { BetEventStatus } from '../bet-events/entities/bet-event.entity';

@Injectable()
export class BetsService {
  constructor(
    @InjectRepository(Bet)
    private betsRepository: Repository<Bet>,
    private usersService: UsersService,
    @Inject(forwardRef(() => BetEventsService))
    private betEventsService: BetEventsService,
    @Inject(forwardRef(() => TransactionsService))
    private transactionsService: TransactionsService,
  ) {}

  // Создать ставку
  async create(userId: number, createBetDto: CreateBetDto): Promise<Bet> {
    const { betEventId, participantId, amount } = createBetDto;

    // Проверяем существование события
    const betEvent = await this.betEventsService.findOne(betEventId);

    // Проверяем, что событие ещё не началось или активно
    if (betEvent.status === BetEventStatus.FINISHED || betEvent.status === BetEventStatus.CANCELLED) {
      throw new BadRequestException('Ставки на это событие больше не принимаются');
    }

    // Проверяем существование участника
    const participants = await this.betEventsService.getParticipants(betEventId);
    const participant = participants.find((p) => p.id === participantId);

    if (!participant) {
      throw new NotFoundException('Участник не найден');
    }

    // Проверяем баланс пользователя
    const user = await this.usersService.findOne(userId);
    if (Number(user.balance) < amount) {
      throw new BadRequestException('Недостаточно средств');
    }

    // Списываем средства с баланса
    await this.usersService.subtractBalance(userId, amount);

    // Создаём ставку
    const bet = this.betsRepository.create({
      userId,
      betEventId,
      participantId,
      amount,
      status: BetStatus.PENDING,
    });

    const savedBet = await this.betsRepository.save(bet);

    // Создаём транзакцию списания
    await this.transactionsService.createBetTransaction(userId, amount, savedBet.id);

    return savedBet;
  }

  // Получить все ставки пользователя
  async findByUser(userId: number): Promise<Bet[]> {
    return this.betsRepository.find({
      where: { userId },
      relations: ['betEvent', 'participant', 'participant.user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Получить ставку по ID
  async findOne(id: number): Promise<Bet> {
    const bet = await this.betsRepository.findOne({
      where: { id },
      relations: ['betEvent', 'participant', 'participant.user'],
    });

    if (!bet) {
      throw new NotFoundException('Ставка не найдена');
    }

    return bet;
  }

  // Обработать результаты события (вызывается при установке победителя)
  async processBetEventResults(betEventId: number, winnerId: number): Promise<void> {
    // Находим все ставки на это событие
    const bets = await this.betsRepository.find({
      where: { betEventId, status: BetStatus.PENDING },
      relations: ['participant'],
    });

    for (const bet of bets) {
      // Проверяем, выиграл ли участник, на которого была сделана ставка
      if (bet.participant.userId === winnerId) {
        // Участник выиграл - деньги переходят участнику
        bet.status = BetStatus.WON;
        await this.betsRepository.save(bet);

        // Начисляем сумму ставки участнику (winnerId)
        await this.usersService.addBalance(winnerId, bet.amount);

        // Создаём транзакцию выигрыша для участника
        await this.transactionsService.createWinningTransaction(
          winnerId,
          bet.amount,
          bet.id,
        );
      } else {
        // Участник проиграл - возвращаем деньги пользователю
        bet.status = BetStatus.LOST;
        await this.betsRepository.save(bet);

        // Возвращаем сумму ставки пользователю
        await this.usersService.addBalance(bet.userId, bet.amount);

        // Создаём транзакцию возврата для пользователя
        await this.transactionsService.createRefundTransaction(
          bet.userId,
          bet.amount,
          bet.id,
        );
      }
    }
  }
}
