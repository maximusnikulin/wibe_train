import { IsNumber, IsString, IsOptional, IsDate } from 'class-validator';

export class PaymentStatusResponseDto {
  @IsNumber()
  id: number;

  @IsNumber()
  amount: number;

  @IsString()
  status: string;

  @IsString()
  type: string;

  @IsString()
  @IsOptional()
  payment_url?: string;

  @IsDate()
  created_at: Date;

  @IsDate()
  updated_at: Date;
}
