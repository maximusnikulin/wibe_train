import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CompetitionStatus } from '../entities/competition.entity';

export class CreateCompetitionDto {
  @ApiProperty({
    example: 'Чемпионат мира по футболу',
    description: 'Название состязания'
  })
  @IsString()
  @IsNotEmpty({ message: 'Название состязания обязательно' })
  title: string;

  @ApiProperty({
    example: 'Международное состязание по футболу',
    description: 'Описание состязания'
  })
  @IsString()
  @IsNotEmpty({ message: 'Описание состязания обязательно' })
  description: string;

  @ApiProperty({
    enum: CompetitionStatus,
    example: CompetitionStatus.UPCOMING,
    description: 'Статус состязания',
    required: false
  })
  @IsEnum(CompetitionStatus, { message: 'Некорректный статус состязания' })
  @IsOptional()
  status?: CompetitionStatus;

  @ApiProperty({
    example: '2024-12-01',
    description: 'Дата начала состязания (ISO 8601)'
  })
  @IsDateString({}, { message: 'Некорректная дата начала' })
  startDate: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Дата окончания состязания (ISO 8601)',
    required: false
  })
  @IsDateString({}, { message: 'Некорректная дата окончания' })
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    example: [2, 5, 7],
    description: 'Массив ID участников (пользователи с ролью PARTICIPANT)',
    type: [Number],
    required: false
  })
  @IsArray({ message: 'participantsIds должен быть массивом' })
  @IsNumber({}, { each: true, message: 'Каждый ID участника должен быть числом' })
  @IsOptional()
  participantsIds?: number[];
}
