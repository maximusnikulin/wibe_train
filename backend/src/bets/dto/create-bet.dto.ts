import { IsNumber, IsPositive, Min } from 'class-validator';

export class CreateBetDto {
  @IsNumber()
  @IsPositive({ message: 'ID состязания должен быть положительным числом' })
  competitionId: number;

  @IsNumber()
  @IsPositive({ message: 'ID участника должен быть положительным числом' })
  participantId: number;

  @IsNumber()
  @Min(1, { message: 'Сумма ставки должна быть не менее 1 копейки' })
  amount: number;
}
