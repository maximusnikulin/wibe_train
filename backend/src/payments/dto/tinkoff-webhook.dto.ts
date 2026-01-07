import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export enum TinkoffWebhookStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export class TinkoffWebhookDto {
  @IsString()
  payment_id: string; // external_id

  @IsString()
  order_id: string; // наш внутренний payment.id

  @IsNumber()
  amount: number;

  @IsEnum(TinkoffWebhookStatus)
  status: TinkoffWebhookStatus;

  @IsString()
  @IsOptional()
  error_code?: string;

  @IsString()
  @IsOptional()
  error_message?: string;
}
