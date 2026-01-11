import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TinkoffMockService } from './tinkoff-mock.service';
import { CompleteBankingOperationDto } from './dto/complete-banking-operation.dto';

@ApiTags('external-banking')
@Controller('external-banking')
export class ExternalBankingController {
  constructor(private readonly tinkoffMockService: TinkoffMockService) {}

  @Post(':paymentId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Завершить банковскую операцию (mock)' })
  @ApiParam({ name: 'paymentId', description: 'ID платежа' })
  @ApiResponse({ status: 200, description: 'Операция успешно завершена' })
  @ApiResponse({ status: 400, description: 'Некорректный статус или платёж не найден' })
  completeBankingOperation(
    @Param('paymentId') paymentId: string,
    @Body() dto: CompleteBankingOperationDto,
  ) {
    const status = dto.status === 'Success' ? 'SUCCESS' : 'FAILED';
    const result = this.tinkoffMockService.confirmPayment(paymentId, status);

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return {
      success: true,
      paymentId,
      status: result.status,
    };
  }
}
