import { IsNumber, Min } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @Min(1, { message: 'Сумма пополнения должна быть не менее 1 копейки' })
  amount: number;
}
