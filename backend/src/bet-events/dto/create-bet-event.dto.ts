import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BetEventStatus } from '../entities/bet-event.entity';

export class CreateBetEventDto {
  @ApiProperty({
    example: 'Чемпионат мира по футболу',
    description: 'Название события'
  })
  @IsString()
  @IsNotEmpty({ message: 'Название события обязательно' })
  title: string;

  @ApiProperty({
    example: 'Международное событие по футболу',
    description: 'Описание события'
  })
  @IsString()
  @IsNotEmpty({ message: 'Описание события обязательно' })
  description: string;

  @ApiProperty({
    enum: BetEventStatus,
    example: BetEventStatus.UPCOMING,
    description: 'Статус события',
    required: false
  })
  @IsEnum(BetEventStatus, { message: 'Некорректный статус события' })
  @IsOptional()
  status?: BetEventStatus;

  @ApiProperty({
    example: '2024-12-01',
    description: 'Дата начала события (ISO 8601)'
  })
  @IsDateString({}, { message: 'Некорректная дата начала' })
  startDate: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Дата окончания события (ISO 8601)',
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
