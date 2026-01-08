import { Controller, Get, Post, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BetsService } from './bets.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('bets')
@Controller('bets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую ставку' })
  @ApiResponse({ status: 201, description: 'Ставка успешно создана' })
  @ApiResponse({ status: 400, description: 'Недостаточно средств или некорректные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  create(@Request() req, @Body() createBetDto: CreateBetDto) {
    return this.betsService.create(req.user.id, createBetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все ставки текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Список ставок получен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findByUser(@Request() req) {
    return this.betsService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить ставку по ID' })
  @ApiParam({ name: 'id', description: 'ID ставки' })
  @ApiResponse({ status: 200, description: 'Ставка получена' })
  @ApiResponse({ status: 404, description: 'Ставка не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.betsService.findOne(id);
  }
}
