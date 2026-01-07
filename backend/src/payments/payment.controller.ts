import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { InitDepositDto } from './dto/init-deposit.dto';
import { InitWithdrawalDto } from './dto/init-withdrawal.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * 1. POST /api/payments/deposit - Инициализация пополнения
   */
  @Post('deposit')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async initDeposit(@Request() req, @Body() initDepositDto: InitDepositDto) {
    const result = await this.paymentService.initDeposit(req.user.id, initDepositDto.amount);

    return {
      payment_id: result.payment_id,
      payment_url: result.payment_url,
      amount: initDepositDto.amount,
    };
  }

  /**
   * 3. GET /api/payments/:id/status - Получить статус платежа
   */
  @Get(':id/status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.paymentService.getPaymentStatus(id, req.user.id);
  }

  /**
   * 4. POST /api/payments/withdraw - Инициализация вывода средств (только для участников)
   */
  @Post('withdraw')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARTICIPANT)
  async initWithdrawal(@Request() req, @Body() initWithdrawalDto: InitWithdrawalDto) {
    const result = await this.paymentService.initWithdrawal(
      req.user.id,
      initWithdrawalDto.amount,
      initWithdrawalDto.cardNumber,
    );

    return {
      payout_id: result.payout_id,
      status: result.status,
    };
  }

  /**
   * 5. GET /api/payments/history - Получить историю платежей текущего пользователя
   */
  @Get('history')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getUserPayments(
    @Request() req,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.paymentService.getUserPayments(req.user.id, limit);
  }
}
