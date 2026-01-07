import { IsString, IsDateString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { CompetitionStatus } from '../entities/competition.entity';

export class UpdateCompetitionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CompetitionStatus)
  @IsOptional()
  status?: CompetitionStatus;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  winnerId?: number;
}
