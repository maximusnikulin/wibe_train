import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  // POST /api/competitions - Создать состязание (требует авторизации)
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCompetitionDto: CreateCompetitionDto) {
    return this.competitionsService.create(createCompetitionDto);
  }

  // GET /api/competitions - Получить все состязания
  @Get()
  findAll() {
    return this.competitionsService.findAll();
  }

  // GET /api/competitions/:id - Получить состязание по ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.competitionsService.findOne(id);
  }

  // PATCH /api/competitions/:id - Обновить состязание (требует авторизации)
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompetitionDto: UpdateCompetitionDto,
  ) {
    return this.competitionsService.update(id, updateCompetitionDto);
  }

  // DELETE /api/competitions/:id - Удалить состязание (требует авторизации)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.competitionsService.remove(id);
  }

  // GET /api/competitions/:id/participants - Получить участников состязания
  @Get(':id/participants')
  getParticipants(@Param('id', ParseIntPipe) id: number) {
    return this.competitionsService.getParticipants(id);
  }
}
