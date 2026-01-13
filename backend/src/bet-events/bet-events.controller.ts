import {Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, HttpCode, Request} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam} from '@nestjs/swagger';
import {BetEventsService} from './bet-events.service';
import {CreateBetEventDto} from './dto/create-bet-event.dto';
import {UpdateBetEventDto} from './dto/update-bet-event.dto';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {RolesGuard} from "../auth/guards/roles.guard";
import {Roles} from "../auth/decorators/roles.decorator";
import {UserRole} from "../users/entities/user.entity";

@ApiTags('bet-events')
@Controller('bet-events')
export class BetEventsController {
    constructor(private readonly betEventsService: BetEventsService) {
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({summary: 'Создать новое событие'})
    @ApiResponse({status: 201, description: 'Событие успешно создано'})
    @ApiResponse({status: 401, description: 'Не авторизован'})
    create(@Body() createBetEventDto: CreateBetEventDto) {
        return this.betEventsService.create(createBetEventDto);
    }

    @Get()
    @ApiOperation({summary: 'Получить все события'})
    @ApiResponse({status: 200, description: 'Список событий получен'})
    findAll() {
        return this.betEventsService.findAll();
    }

    @Get('my-participations')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PARTICIPANT)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({summary: 'Получить события текущего участника с статистикой ставок'})
    @ApiResponse({status: 200, description: 'Список событий участника с статистикой'})
    @ApiResponse({status: 401, description: 'Не авторизован'})
    @ApiResponse({status: 403, description: 'Доступно только участникам'})
    getMyParticipations(@Request() req) {
        return this.betEventsService.findByParticipantWithStats(req.user.id);
    }

    @Get('participant/:userId')
    @ApiOperation({summary: 'Получить события участника'})
    @ApiParam({name: 'userId', description: 'ID участника'})
    @ApiResponse({status: 200, description: 'Список событий участника получен'})
    @ApiResponse({status: 400, description: 'Пользователь не является участником'})
    @ApiResponse({status: 404, description: 'Пользователь не найден'})
    findByParticipant(@Param('userId', ParseIntPipe) userId: number) {
        return this.betEventsService.findByParticipant(userId);
    }

    @Get(':id')
    @ApiOperation({summary: 'Получить событие по ID'})
    @ApiParam({name: 'id', description: 'ID события'})
    @ApiResponse({status: 200, description: 'Событие получено'})
    @ApiResponse({status: 404, description: 'Событие не найдено'})
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.betEventsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({summary: 'Обновить событие'})
    @ApiParam({name: 'id', description: 'ID события'})
    @ApiResponse({status: 200, description: 'Событие успешно обновлено'})
    @ApiResponse({status: 404, description: 'Событие не найдено'})
    @ApiResponse({status: 401, description: 'Не авторизован'})
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateBetEventDto: UpdateBetEventDto,
    ) {
        return this.betEventsService.update(id, updateBetEventDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({summary: 'Удалить событие'})
    @ApiParam({name: 'id', description: 'ID события'})
    @ApiResponse({status: 200, description: 'Событие успешно удалено'})
    @ApiResponse({status: 404, description: 'Событие не найдено'})
    @ApiResponse({status: 401, description: 'Не авторизован'})
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.betEventsService.remove(id);
    }

    @Post('/end/:id/:winnerId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(200)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({summary: 'Завершить событие и рассчитать ставки'})
    @ApiParam({name: 'id', description: 'ID события'})
    @ApiResponse({status: 200, description: 'Завершили событие'})
    @ApiResponse({status: 404, description: 'Событие не найдено'})
    @ApiResponse({status: 401, description: 'Не авторизован'})
    end(@Param('id', ParseIntPipe) id: number, @Param('winnerId', ParseIntPipe) winnerId: number) {
        return this.betEventsService.end(id, winnerId);
    }

    @Get(':id/participants')
    @ApiOperation({summary: 'Получить участников события'})
    @ApiParam({name: 'id', description: 'ID события'})
    @ApiResponse({status: 200, description: 'Список участников получен'})
    getParticipants(@Param('id', ParseIntPipe) id: number) {
        return this.betEventsService.getParticipants(id);
    }
}
