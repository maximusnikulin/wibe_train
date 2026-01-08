import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { TinkoffWebhookDto } from './dto/tinkoff-webhook.dto';
import { PaymentType } from './entities/payment.entity';

@ApiTags('payments')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('tinkoff')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook от Тинькофф для обработки платежей',
    description: 'Единый endpoint для уведомлений от Тинькофф. Автоматически определяет тип операции (deposit/payout). НЕ требует авторизации.'
  })
  @ApiResponse({ status: 200, description: 'Webhook успешно обработан' })
  @ApiResponse({ status: 400, description: 'Некорректные данные webhook' })
  @ApiResponse({ status: 404, description: 'Платеж не найден' })
  async handleTinkoffWebhook(@Body() webhookData: TinkoffWebhookDto) {
    this.logger.log(`Получен webhook от Тинькофф: ${JSON.stringify(webhookData)}`);

    // TODO: В продакшене проверить подпись запроса от Тинькофф
    // const isValid = this.validateTinkoffSignature(webhookData);
    // if (!isValid) {
    //   throw new UnauthorizedException('Неверная подпись webhook');
    // }

    // Определяем тип операции по external_id
    // Если начинается с "payout_" - это выплата, иначе - пополнение
    const isPayout = webhookData.payment_id.startsWith('payout_');

    if (isPayout) {
      this.logger.log(`Обработка webhook для выплаты: ${webhookData.payment_id}`);
      return this.paymentService.processPayoutWebhook(webhookData);
    } else {
      this.logger.log(`Обработка webhook для пополнения: ${webhookData.payment_id}`);
      return this.paymentService.processWebhook(webhookData);
    }
  }
}
