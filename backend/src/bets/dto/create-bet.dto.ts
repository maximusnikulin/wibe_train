import { IsNumber, IsPositive, Min } from 'class-validator';

export class CreateBetDto {
  @IsNumber()
  @IsPositive({ message: 'ID события должен быть положительным числом' })
  betEventId: number;

  @IsNumber()
  @IsPositive({ message: 'ID участника должен быть положительным числом' })
  participantId: number;

  @IsNumber()
  @Min(1, { message: 'Сумма ставки должна быть не менее 1 копейки' })
  amount: number;
}
