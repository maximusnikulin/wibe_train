import {Injectable, NotFoundException, BadRequestException, Inject, forwardRef} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {Competition, CompetitionStatus} from './entities/competition.entity';
import { CompetitionParticipant } from './entities/competition-participant.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import {BetsService} from "../bets/bets.service";

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectRepository(Competition)
    private competitionsRepository: Repository<Competition>,
    @InjectRepository(CompetitionParticipant)
    private participantsRepository: Repository<CompetitionParticipant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => BetsService))
    private betsService: BetsService,
  ) {}

  // Создать состязание
  async create(createCompetitionDto: CreateCompetitionDto): Promise<Competition> {
    const { participantsIds, ...competitionData } = createCompetitionDto;

    // Создаём состязание
    const competition = this.competitionsRepository.create(competitionData);
    const savedCompetition = await this.competitionsRepository.save(competition);

    // Если указаны участники, добавляем их
    if (participantsIds && participantsIds.length > 0) {
      await this.validateAndAddParticipants(savedCompetition.id, participantsIds);
    }

    // Возвращаем состязание с участниками
    return this.findOne(savedCompetition.id);
  }

  // Получить все состязания
  async findAll(): Promise<Competition[]> {
    return this.competitionsRepository.find({
      relations: ['participants', 'participants.user'],
      order: { startDate: 'DESC' },
    });
  }

  // Получить состязание по ID
  async findOne(id: number): Promise<Competition> {
    const competition = await this.competitionsRepository.findOne({
      where: { id },
      relations: ['participants', 'participants.user'],
    });

    if (!competition) {
      throw new NotFoundException('Состязание не найдено');
    }

    return competition;
  }

  // Обновить состязание
  async update(id: number, updateCompetitionDto: UpdateCompetitionDto): Promise<Competition> {
    const { participantsIds, ...competitionData } = updateCompetitionDto;

    const competition = await this.findOne(id);
    if (competition.status === CompetitionStatus.FINISHED || competition.status === CompetitionStatus.CANCELLED) {
      throw new BadRequestException("Нельзя обновить завершенное или отмененное событие")
    }

    Object.assign(competition, competitionData);
    await this.competitionsRepository.save(competition);

    // Если указаны участники, заменяем текущих
    if (participantsIds !== undefined) {
      // Удаляем текущих участников
      await this.participantsRepository.delete({ competitionId: id });

      // Добавляем новых участников (если массив не пустой)
      if (participantsIds.length > 0) {
        await this.validateAndAddParticipants(id, participantsIds);
      }
    }

    // Возвращаем обновлённое состязание с участниками
    return this.findOne(id);
  }

  async end(id: number, winnerId: number): Promise<Competition> {
    const competition = await this.findOne(id);

    // Проверка статуса соревнования
    if (competition.status === CompetitionStatus.FINISHED) {
      throw new BadRequestException('Соревнование уже завершено');
    }
    if (competition.status === CompetitionStatus.CANCELLED) {
      throw new BadRequestException('Соревнование отменено');
    }

    // Валидация winnerId как участника соревнования
    const isParticipant = competition.participants?.some(
      (p) => p.userId === winnerId
    );
    if (!isParticipant) {
      throw new BadRequestException('Победитель должен быть участником соревнования');
    }

    Object.assign(competition, {
      winnerId,
      status: CompetitionStatus.FINISHED
    });

    await this.betsService.processCompetitionResults(id, winnerId);
    await this.competitionsRepository.save(competition);

    return this.findOne(id);
  }

  // Удалить состязание
  async remove(id: number): Promise<void> {
    const competition = await this.findOne(id);
    await this.competitionsRepository.remove(competition);
  }

  // Получить всех участников состязания
  async getParticipants(competitionId: number): Promise<CompetitionParticipant[]> {
    return this.participantsRepository.find({
      where: { competitionId },
      relations: ['user'],
    });
  }

  // Получить все состязания, в которых участвует пользователь
  async findByParticipant(userId: number): Promise<Competition[]> {
    // Проверяем существование пользователя
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем, что пользователь имеет роль PARTICIPANT
    if (user.role !== UserRole.PARTICIPANT) {
      throw new BadRequestException('Пользователь не является участником состязаний');
    }

    const participants = await this.participantsRepository.find({
      where: { userId },
      relations: ['competition', 'competition.participants', 'competition.participants.user'],
    });

    // Извлекаем уникальные состязания из участников
    const competitions = participants.map(p => p.competition);

    return competitions;
  }

  /**
   * Вспомогательный метод: валидация и добавление участников
   */
  private async validateAndAddParticipants(
    competitionId: number,
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
        competitionId,
        userId,
      })
    );

    await this.participantsRepository.save(participants);
  }
}
