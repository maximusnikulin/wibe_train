import {Injectable, NotFoundException, BadRequestException, Inject, forwardRef} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {BetEvent, BetEventStatus} from './entities/bet-event.entity';
import { BetEventParticipant } from './entities/bet-event-participant.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Bet } from '../bets/entities/bet.entity';
import { CreateBetEventDto } from './dto/create-bet-event.dto';
import { UpdateBetEventDto } from './dto/update-bet-event.dto';
import {BetsService} from "../bets/bets.service";

@Injectable()
export class BetEventsService {
  constructor(
    @InjectRepository(BetEvent)
    private betEventsRepository: Repository<BetEvent>,
    @InjectRepository(BetEventParticipant)
    private participantsRepository: Repository<BetEventParticipant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Bet)
    private betsRepository: Repository<Bet>,
    @Inject(forwardRef(() => BetsService))
    private betsService: BetsService,
  ) {}

  // Создать событие
  async create(createBetEventDto: CreateBetEventDto): Promise<BetEvent> {
    const { participantsIds, ...betEventData } = createBetEventDto;

    // Создаём событие
    const betEvent = this.betEventsRepository.create(betEventData);
    const savedBetEvent = await this.betEventsRepository.save(betEvent);

    // Если указаны участники, добавляем их
    if (participantsIds && participantsIds.length > 0) {
      await this.validateAndAddParticipants(savedBetEvent.id, participantsIds);
    }

    // Возвращаем событие с участниками
    return this.findOne(savedBetEvent.id);
  }

  // Получить все события
  async findAll(): Promise<BetEvent[]> {
    return this.betEventsRepository.find({
      relations: ['participants', 'participants.user'],
      order: { startDate: 'DESC' },
    });
  }

  // Получить событие по ID
  async findOne(id: number): Promise<BetEvent> {
    const betEvent = await this.betEventsRepository.findOne({
      where: { id },
      relations: ['participants', 'participants.user'],
    });

    if (!betEvent) {
      throw new NotFoundException('Событие не найдено');
    }

    return betEvent;
  }

  // Обновить событие
  async update(id: number, updateBetEventDto: UpdateBetEventDto): Promise<BetEvent> {
    const { participantsIds, ...betEventData } = updateBetEventDto;

    const betEvent = await this.findOne(id);
    if (betEvent.status === BetEventStatus.FINISHED || betEvent.status === BetEventStatus.CANCELLED) {
      throw new BadRequestException("Нельзя обновить завершенное или отмененное событие")
    }

    Object.assign(betEvent, betEventData);
    await this.betEventsRepository.save(betEvent);

    // Если указаны участники, заменяем текущих
    if (participantsIds !== undefined) {
      // Удаляем текущих участников
      await this.participantsRepository.delete({ betEventId: id });

      // Добавляем новых участников (если массив не пустой)
      if (participantsIds.length > 0) {
        await this.validateAndAddParticipants(id, participantsIds);
      }
    }

    // Возвращаем обновлённое событие с участниками
    return this.findOne(id);
  }

  async end(id: number, winnerId: number): Promise<BetEvent> {
    const betEvent = await this.findOne(id);

    // Проверка статуса события
    if (betEvent.status === BetEventStatus.FINISHED) {
      throw new BadRequestException('Событие уже завершено');
    }
    if (betEvent.status === BetEventStatus.CANCELLED) {
      throw new BadRequestException('Событие отменено');
    }

    // Валидация winnerId как участника события
    const isParticipant = betEvent.participants?.some(
      (p) => p.userId === winnerId
    );
    if (!isParticipant) {
      throw new BadRequestException('Победитель должен быть участником события');
    }

    Object.assign(betEvent, {
      winnerId,
      status: BetEventStatus.FINISHED
    });

    await this.betsService.processBetEventResults(id, winnerId);
    await this.betEventsRepository.save(betEvent);

    return this.findOne(id);
  }

  // Удалить событие
  async remove(id: number): Promise<void> {
    const betEvent = await this.findOne(id);
    await this.betEventsRepository.remove(betEvent);
  }

  // Получить всех участников события
  async getParticipants(betEventId: number): Promise<BetEventParticipant[]> {
    return this.participantsRepository.find({
      where: { betEventId },
      relations: ['user'],
    });
  }

  // Получить все события, в которых участвует пользователь
  async findByParticipant(userId: number): Promise<BetEvent[]> {
    // Проверяем существование пользователя
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем, что пользователь имеет роль PARTICIPANT
    if (user.role !== UserRole.PARTICIPANT) {
      throw new BadRequestException('Пользователь не является участником событий');
    }

    const participants = await this.participantsRepository.find({
      where: { userId },
      relations: ['betEvent', 'betEvent.participants', 'betEvent.participants.user'],
    });

    // Извлекаем уникальные события из участников
    const betEvents = participants.map(p => p.betEvent);

    return betEvents;
  }

  // Получить события участника со статистикой ставок
  async findByParticipantWithStats(userId: number): Promise<any[]> {
    // Получаем все записи участия пользователя
    const participations = await this.participantsRepository.find({
      where: { userId },
      relations: ['betEvent'],
    });

    const result = [];

    for (const participation of participations) {
      const betEvent = participation.betEvent;

      // Получаем все ставки на этого участника в данном событии
      const betsOnParticipant = await this.betsRepository.find({
        where: {
          betEventId: betEvent.id,
          participantId: participation.id,
        },
      });

      const betsOnMe = betsOnParticipant.length;
      const totalBetsAmount = betsOnParticipant.reduce(
        (sum, bet) => sum + Number(bet.amount),
        0,
      );

      // Потенциальный выигрыш = сумма всех ставок на этого участника
      const potentialWinning = totalBetsAmount;

      // Определяем место (если событие завершено)
      let place: number | undefined;
      if (betEvent.status === BetEventStatus.FINISHED && betEvent.winnerId) {
        place = betEvent.winnerId === userId ? 1 : undefined;
      }

      result.push({
        id: betEvent.id,
        title: betEvent.title,
        description: betEvent.description,
        startDate: betEvent.startDate,
        endDate: betEvent.endDate,
        status: betEvent.status,
        createdAt: betEvent.createdAt,
        updatedAt: betEvent.updatedAt,
        participantId: participation.id,
        betsOnMe,
        totalBetsAmount,
        potentialWinning,
        place,
      });
    }

    return result;
  }

  /**
   * Вспомогательный метод: валидация и добавление участников
   */
  private async validateAndAddParticipants(
    betEventId: number,
    participantsIds: number[],
  ): Promise<void> {
    // Получаем всех пользователей по ID
    const users = await this.userRepository.find({
      where: { id: In(participantsIds) }
    });

    // Проверяем, что все пользователи найдены
    if (users.length !== participantsIds.length) {
      const foundIds = users.map(u => u.id);
      const notFoundIds = participantsIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(
        `Пользователи с ID ${notFoundIds.join(', ')} не найдены`
      );
    }

    // Проверяем, что все пользователи имеют роль PARTICIPANT
    const nonParticipants = users.filter(u => u.role !== UserRole.PARTICIPANT);
    if (nonParticipants.length > 0) {
      const nonParticipantIds = nonParticipants.map(u => u.id).join(', ');
      throw new BadRequestException(
        `Пользователи с ID ${nonParticipantIds} не имеют роль PARTICIPANT`
      );
    }

    // Создаём записи участников
    const participants = participantsIds.map(userId =>
      this.participantsRepository.create({
        betEventId,
        userId,
      })
    );

    await this.participantsRepository.save(participants);
  }
}
