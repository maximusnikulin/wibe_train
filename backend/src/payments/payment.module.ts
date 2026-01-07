import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { WebhooksController } from './webhooks.controller';
import { Payment } from './entities/payment.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { ExternalBankingModule } from '../external-banking/external-banking.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Transaction, User]),
    ExternalBankingModule, // Импортируем для доступа к TinkoffMockService
  ],
  controllers: [PaymentController, WebhooksController],
  providers: [PaymentService, RolesGuard],
  exports: [PaymentService],
})
export class PaymentModule {}
