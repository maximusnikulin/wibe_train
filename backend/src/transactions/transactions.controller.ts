import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { DepositDto } from './dto/deposit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard) // Все роуты требуют аутентификации
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // POST /api/transactions/deposit - Пополнить счёт
  @Post('deposit')
  deposit(@Request() req, @Body() depositDto: DepositDto) {
    return this.transactionsService.createDepositTransaction(req.user.id, depositDto.amount);
  }

  // GET /api/transactions - Получить историю транзакций текущего пользователя
  @Get()
  findByUser(@Request() req) {
    return this.transactionsService.findByUser(req.user.id);
  }
}
