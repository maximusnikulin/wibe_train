import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteBankingOperationDto {
  @ApiProperty({
    example: 'Success',
    description: 'Статус завершения операции',
    enum: ['Success', 'Failed'],
  })
  @IsIn(['Success', 'Failed'], { message: 'Статус должен быть Success или Failed' })
  status: 'Success' | 'Failed';
}
