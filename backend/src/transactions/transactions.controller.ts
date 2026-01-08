import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { DepositDto } from './dto/deposit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить историю транзакций текущего пользователя' })
  @ApiResponse({ status: 200, description: 'История транзакций получена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findByUser(@Request() req) {
    return this.transactionsService.findByUser(req.user.id);
  }
}
