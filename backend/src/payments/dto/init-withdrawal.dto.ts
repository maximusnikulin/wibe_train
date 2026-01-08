import { IsNumber, Min, Max, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitWithdrawalDto {
  @ApiProperty({
    example: 500,
    description: 'Сумма вывода (от 100 до 1 000 000 руб.)',
    minimum: 100,
    maximum: 1000000
  })
  @IsNumber()
  @Min(100, { message: 'Минимальная сумма вывода: 100 руб.' })
  @Max(1000000, { message: 'Максимальная сумма вывода: 1 000 000 руб.' })
  amount: number;

  @ApiProperty({
    example: '1234567890123456',
    description: 'Номер банковской карты (16-19 цифр)',
    minLength: 16,
    maxLength: 19
  })
  @IsString()
  @Length(16, 19, { message: 'Номер карты должен содержать от 16 до 19 символов' })
  @Matches(/^\d+$/, { message: 'Номер карты должен содержать только цифры' })
  cardNumber: string;
}
