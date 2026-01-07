import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { CompetitionStatus } from '../entities/competition.entity';

export class CreateCompetitionDto {
  @IsString()
  @IsNotEmpty({ message: 'Название состязания обязательно' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Описание состязания обязательно' })
  description: string;

  @IsEnum(CompetitionStatus, { message: 'Некорректный статус состязания' })
  @IsOptional()
  status?: CompetitionStatus;

  @IsDateString({}, { message: 'Некорректная дата начала' })
  startDate: string;

  @IsDateString({}, { message: 'Некорректная дата окончания' })
  @IsOptional()
  endDate?: string;
}
