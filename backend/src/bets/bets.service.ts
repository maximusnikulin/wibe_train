import {Injectable, BadRequestException, NotFoundException, Inject, forwardRef} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bet, BetStatus } from './entities/bet.entity';
import { CreateBetDto } from './dto/create-bet.dto';
import { UsersService } from '../users/users.service';
import { CompetitionsService } from '../competitions/competitions.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CompetitionStatus } from '../competitions/entities/competition.entity';

@Injectable()
export class BetsService {
  constructor(
    @InjectRepository(Bet)
    private betsRepository: Repository<Bet>,
    private usersService: UsersService,
    @Inject(forwardRef(() => CompetitionsService))
    private competitionsService: CompetitionsService,
    @Inject(forwardRef(() => TransactionsService))
    private transactionsService: TransactionsService,
  ) {}

  // Создать ставку
  async create(userId: number, createBetDto: CreateBetDto): Promise<Bet> {
    const { competitionId, participantId, amount } = createBetDto;

    // Проверяем существование состязания
    const competition = await this.competitionsService.findOne(competitionId);

    // Проверяем, что состязание ещё не началось или активно
    if (competition.status === CompetitionStatus.FINISHED || competition.status === CompetitionStatus.CANCELLED) {
      throw new BadRequestException('Ставки на это состязание больше не принимаются');
    }

    // Проверяем существование участника
    const participants = await this.competitionsService.getParticipants(competitionId);
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
      competitionId,
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
      relations: ['competition', 'participant', 'participant.user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Получить ставку по ID
  async findOne(id: number): Promise<Bet> {
    const bet = await this.betsRepository.findOne({
      where: { id },
      relations: ['competition', 'participant', 'participant.user'],
    });

    if (!bet) {
      throw new NotFoundException('Ставка не найдена');
    }

    return bet;
  }

  // Обработать результаты состязания (вызывается при установке победителя)
  async processCompetitionResults(competitionId: number, winnerId: number): Promise<void> {
    // Находим все ставки на это состязание
    const bets = await this.betsRepository.find({
      where: { competitionId, status: BetStatus.PENDING },
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
