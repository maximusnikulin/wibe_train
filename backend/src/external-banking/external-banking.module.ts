import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TinkoffMockService } from './tinkoff-mock.service';

/**
 * Модуль для внешних банковских сервисов
 * Содержит интеграции с платёжными системами (Тинькофф и др.)
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [TinkoffMockService],
  exports: [TinkoffMockService],
})
export class ExternalBankingModule {}
