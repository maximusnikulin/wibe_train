import { IsString, IsDateString, IsEnum, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BetEventStatus } from '../entities/bet-event.entity';

export class UpdateBetEventDto {
  @ApiProperty({
    example: 'Чемпионат мира по футболу',
    description: 'Название события',
    required: false
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'Международное событие по футболу',
    description: 'Описание события',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: BetEventStatus,
    example: BetEventStatus.ACTIVE,
    description: 'Статус события',
    required: false
  })
  @IsEnum(BetEventStatus)
  @IsOptional()
  status?: BetEventStatus;

  @ApiProperty({
    example: '2024-12-01',
    description: 'Дата начала события',
    required: false
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Дата окончания события',
    required: false
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    example: 5,
    description: 'ID победителя события',
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
