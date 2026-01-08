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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { InitDepositDto } from './dto/init-deposit.dto';
import { InitWithdrawalDto } from './dto/init-withdrawal.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('deposit')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Инициализация пополнения счёта' })
  @ApiResponse({ status: 201, description: 'Платеж успешно инициализирован' })
  @ApiResponse({ status: 400, description: 'Некорректная сумма' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async initDeposit(@Request() req, @Body() initDepositDto: InitDepositDto) {
    const result = await this.paymentService.initDeposit(req.user.id, initDepositDto.amount);

    return {
      payment_id: result.payment_id,
      payment_url: result.payment_url,
      amount: initDepositDto.amount,
    };
  }

  @Get(':id/status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Получить статус платежа по ID' })
  @ApiParam({ name: 'id', description: 'ID платежа' })
  @ApiResponse({ status: 200, description: 'Статус платежа получен' })
  @ApiResponse({ status: 404, description: 'Платеж не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getPaymentStatus(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.paymentService.getPaymentStatus(id, req.user.id);
  }

  @Post('withdraw')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARTICIPANT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Инициализация вывода средств (только для участников)' })
  @ApiResponse({ status: 201, description: 'Вывод успешно инициализирован' })
  @ApiResponse({ status: 400, description: 'Недостаточно средств или некорректные данные' })
  @ApiResponse({ status: 403, description: 'Доступно только участникам' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
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

  @Get('history')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Получить историю платежей текущего пользователя' })
  @ApiQuery({ name: 'limit', required: false, description: 'Количество записей (по умолчанию 50)', example: 50 })
  @ApiResponse({ status: 200, description: 'История платежей получена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getUserPayments(
    @Request() req,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.paymentService.getUserPayments(req.user.id, limit);
  }
}
