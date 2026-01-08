import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competition } from './entities/competition.entity';
import { CompetitionParticipant } from './entities/competition-participant.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectRepository(Competition)
    private competitionsRepository: Repository<Competition>,
    @InjectRepository(CompetitionParticipant)
    private participantsRepository: Repository<CompetitionParticipant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Создать состязание
  async create(createCompetitionDto: CreateCompetitionDto): Promise<Competition> {
    const competition = this.competitionsRepository.create(createCompetitionDto);
    return this.competitionsRepository.save(competition);
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
    const competition = await this.findOne(id);
    Object.assign(competition, updateCompetitionDto);
    return this.competitionsRepository.save(competition);
  }

  // Удалить состязание
  async remove(id: number): Promise<void> {
    const competition = await this.findOne(id);
    await this.competitionsRepository.remove(competition);
  }

  // Добавить участника к состязанию
  async addParticipant(
    competitionId: number,
    userId: number,
    additionalInfo?: string,
  ): Promise<CompetitionParticipant> {
    const competition = await this.findOne(competitionId);

    const participant = this.participantsRepository.create({
      competitionId: competition.id,
      userId,
      additionalInfo,
    });

    return this.participantsRepository.save(participant);
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
}
