import {Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, HttpCode, Request} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam} from '@nestjs/swagger';
import {CompetitionsService} from './competitions.service';
import {CreateCompetitionDto} from './dto/create-competition.dto';
import {UpdateCompetitionDto} from './dto/update-competition.dto';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {RolesGuard} from "../auth/guards/roles.guard";
import {Roles} from "../auth/decorators/roles.decorator";
import {UserRole} from "../users/entities/user.entity";

@ApiTags('competitions')
@Controller('competitions')
export class CompetitionsController {
    constructor(private readonly competitionsService: CompetitionsService) {
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({summary: 'Создать новое состязание'})
    @ApiResponse({status: 201, description: 'Состязание успешно создано'})
    @ApiResponse({status: 401, description: 'Не авторизован'})
    create(@Body() createCompetitionDto: CreateCompetitionDto) {
        return this.competitionsService.create(createCompetitionDto);
    }

    @Get()
    @ApiOperation({summary: 'Получить все состязания'})
    @ApiResponse({status: 200, description: 'Список состязаний получен'})
    findAll() {
        return this.competitionsService.findAll();
    }

    @Get('my-participations')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PARTICIPANT)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({summary: 'Получить состязания текущего участника с статистикой ставок'})
    @ApiResponse({status: 200, description: 'Список состязаний участника с статистикой'})
    @ApiResponse({status: 401, description: 'Не авторизован'})
    @ApiResponse({status: 403, description: 'Доступно только участникам'})
    getMyParticipations(@Request() req) {
        return this.competitionsService.findByParticipantWithStats(req.user.id);
    }

    @Get('participant/:userId')
    @ApiOperation({summary: 'Получить состязания участника'})
    @ApiParam({name: 'userId', description: 'ID участника'})
    @ApiResponse({status: 200, description: 'Список состязаний участника получен'})
    @ApiResponse({status: 400, description: 'Пользователь не является участником'})
    @ApiResponse({status: 404, description: 'Пользователь не найден'})
    findByParticipant(@Param('userId', ParseIntPipe) userId: number) {
        return this.competitionsService.findByParticipant(userId);
    }

    @Get(':id')
    @ApiOperation({summary: 'Получить состязание по ID'})
    @ApiParam({name: 'id', description: 'ID состязания'})
    @ApiResponse({status: 200, description: 'Состязание получено'})
    @ApiResponse({status: 404, description: 'Состязание не найдено'})
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.competitionsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({summary: 'Обновить состязание'})
    @ApiParam({name: 'id', description: 'ID состязания'})
    @ApiResponse({status: 200, description: 'Состязание успешно обновлено'})
    @ApiResponse({status: 404, description: 'Состязание не найдено'})
    @ApiResponse({status: 401, description: 'Не авторизован'})
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCompetitionDto: UpdateCompetitionDto,
    ) {
        return this.competitionsService.update(id, updateCompetitionDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({summary: 'Удалить состязание'})
    @ApiParam({name: 'id', description: 'ID состязания'})
    @ApiResponse({status: 200, description: 'Состязание успешно удалено'})
    @ApiResponse({status: 404, description: 'Состязание не найдено'})
    @ApiResponse({status: 401, description: 'Не авторизован'})
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.competitionsService.remove(id);
    }

    @Post('/end/:id/:winnerId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(200)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({summary: 'Завершить состязание и рассчитать ставки'})
    @ApiParam({name: 'id', description: 'ID состязания'})
    @ApiResponse({status: 200, description: 'Завершили состязание'})
    @ApiResponse({status: 404, description: 'Состязание не найдено'})
    @ApiResponse({status: 401, description: 'Не авторизован'})
    end(@Param('id', ParseIntPipe) id: number, @Param('winnerId', ParseIntPipe) winnerId: number) {
        return this.competitionsService.end(id, winnerId);
    }

    @Get(':id/participants')
    @ApiOperation({summary: 'Получить участников состязания'})
    @ApiParam({name: 'id', description: 'ID состязания'})
    @ApiResponse({status: 200, description: 'Список участников получен'})
    getParticipants(@Param('id', ParseIntPipe) id: number) {
        return this.competitionsService.getParticipants(id);
    }
}
