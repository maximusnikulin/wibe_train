import { Controller, Get, Post, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { BetsService } from './bets.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bets')
@UseGuards(JwtAuthGuard) // Все роуты требуют аутентификации
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  // POST /api/bets - Создать ставку
  @Post()
  create(@Request() req, @Body() createBetDto: CreateBetDto) {
    return this.betsService.create(req.user.id, createBetDto);
  }

  // GET /api/bets - Получить все ставки текущего пользователя
  @Get()
  findByUser(@Request() req) {
    return this.betsService.findByUser(req.user.id);
  }

  // GET /api/bets/:id - Получить ставку по ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.betsService.findOne(id);
  }
}
