import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CompetitionsService } from './competitions.service';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('competitions')
@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Создать новое состязание' })
  @ApiResponse({ status: 201, description: 'Состязание успешно создано' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  create(@Body() createCompetitionDto: CreateCompetitionDto) {
    return this.competitionsService.create(createCompetitionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все состязания' })
  @ApiResponse({ status: 200, description: 'Список состязаний получен' })
  findAll() {
    return this.competitionsService.findAll();
  }

  @Get('participant/:userId')
  @ApiOperation({ summary: 'Получить состязания участника' })
  @ApiParam({ name: 'userId', description: 'ID участника' })
  @ApiResponse({ status: 200, description: 'Список состязаний участника получен' })
  @ApiResponse({ status: 400, description: 'Пользователь не является участником' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  findByParticipant(@Param('userId', ParseIntPipe) userId: number) {
    return this.competitionsService.findByParticipant(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить состязание по ID' })
  @ApiParam({ name: 'id', description: 'ID состязания' })
  @ApiResponse({ status: 200, description: 'Состязание получено' })
  @ApiResponse({ status: 404, description: 'Состязание не найдено' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.competitionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Обновить состязание' })
  @ApiParam({ name: 'id', description: 'ID состязания' })
  @ApiResponse({ status: 200, description: 'Состязание успешно обновлено' })
  @ApiResponse({ status: 404, description: 'Состязание не найдено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompetitionDto: UpdateCompetitionDto,
  ) {
    return this.competitionsService.update(id, updateCompetitionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Удалить состязание' })
  @ApiParam({ name: 'id', description: 'ID состязания' })
  @ApiResponse({ status: 200, description: 'Состязание успешно удалено' })
  @ApiResponse({ status: 404, description: 'Состязание не найдено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.competitionsService.remove(id);
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'Получить участников состязания' })
  @ApiParam({ name: 'id', description: 'ID состязания' })
  @ApiResponse({ status: 200, description: 'Список участников получен' })
  getParticipants(@Param('id', ParseIntPipe) id: number) {
    return this.competitionsService.getParticipants(id);
  }
}
