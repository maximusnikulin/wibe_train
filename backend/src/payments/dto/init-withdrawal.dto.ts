import { IsNumber, Min, Max, IsString, Length, Matches } from 'class-validator';

export class InitWithdrawalDto {
  @IsNumber()
  @Min(100, { message: 'Минимальная сумма вывода: 100 руб.' })
  @Max(1000000, { message: 'Максимальная сумма вывода: 1 000 000 руб.' })
  amount: number;

  @IsString()
  @Length(16, 19, { message: 'Номер карты должен содержать от 16 до 19 символов' })
  @Matches(/^\d+$/, { message: 'Номер карты должен содержать только цифры' })
  cardNumber: string;
}
