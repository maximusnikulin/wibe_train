import { IsNumber, Min, Max } from 'class-validator';

export class InitDepositDto {
  @IsNumber()
  @Min(100, { message: 'Минимальная сумма пополнения: 100 руб.' })
  @Max(1000000, { message: 'Максимальная сумма пополнения: 1 000 000 руб.' })
  amount: number;
}
