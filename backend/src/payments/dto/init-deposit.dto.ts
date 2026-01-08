import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitDepositDto {
  @ApiProperty({
    example: 1000,
    description: 'Сумма пополнения (от 100 до 1 000 000 руб.)',
    minimum: 100,
    maximum: 1000000
  })
  @IsNumber()
  @Min(100, { message: 'Минимальная сумма пополнения: 100 руб.' })
  @Max(1000000, { message: 'Максимальная сумма пополнения: 1 000 000 руб.' })
  amount: number;
}
