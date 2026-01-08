import { IsString, IsDateString, IsEnum, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CompetitionStatus } from '../entities/competition.entity';

export class UpdateCompetitionDto {
  @ApiProperty({
    example: 'Чемпионат мира по футболу',
    description: 'Название состязания',
    required: false
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'Международное состязание по футболу',
    description: 'Описание состязания',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: CompetitionStatus,
    example: CompetitionStatus.ACTIVE,
    description: 'Статус состязания',
    required: false
  })
  @IsEnum(CompetitionStatus)
  @IsOptional()
  status?: CompetitionStatus;

  @ApiProperty({
    example: '2024-12-01',
    description: 'Дата начала состязания',
    required: false
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Дата окончания состязания',
    required: false
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    example: 5,
    description: 'ID победителя состязания',
    required: false
  })
  @IsNumber()
  @IsOptional()
  winnerId?: number;

  @ApiProperty({
    example: [2, 5, 7],
    description: 'Массив ID участников (заменит текущих участников)',
    type: [Number],
    required: false
  })
  @IsArray({ message: 'participantsIds должен быть массивом' })
  @IsNumber({}, { each: true, message: 'Каждый ID участника должен быть числом' })
  @IsOptional()
  participantsIds?: number[];
}
