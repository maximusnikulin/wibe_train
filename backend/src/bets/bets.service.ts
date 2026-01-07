import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
    private competitionsService: CompetitionsService,
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

    // Получаем участника и его коэффициент
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

    // Рассчитываем потенциальный выигрыш
    const potentialWinning = Math.floor(amount * Number(participant.odds));

    // Создаём ставку
    const bet = this.betsRepository.create({
      userId,
      competitionId,
      participantId,
      amount,
      odds: participant.odds,
      potentialWinning,
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
      // Проверяем, выиграла ли ставка
      if (bet.participant.userId === winnerId) {
        // Ставка выиграла
        bet.status = BetStatus.WON;
        await this.betsRepository.save(bet);

        // Начисляем выигрыш пользователю
        await this.usersService.addBalance(bet.userId, bet.potentialWinning);

        // Создаём транзакцию выигрыша
        await this.transactionsService.createWinningTransaction(
          bet.userId,
          bet.potentialWinning,
          bet.id,
        );
      } else {
        // Ставка проиграла
        bet.status = BetStatus.LOST;
        await this.betsRepository.save(bet);
      }
    }
  }
}
