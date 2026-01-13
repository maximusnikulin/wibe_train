import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Получить баланс текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Баланс получен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getBalance(@Request() req) {
    return this.usersService.getBalance(req.user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Профиль получен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);

    // Не возвращаем пароль
    const { password, ...result } = user;
    return result;
  }

  @Get('participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить список всех участников (только для админа)' })
  @ApiResponse({ status: 200, description: 'Список участников получен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Доступно только админу' })
  async getParticipants() {
    return this.usersService.findParticipants();
  }

  // Публичный эндпоинт - получить профиль пользователя по ID
  // ВАЖНО: этот роут должен быть последним, так как :id перехватывает все
  @Get(':id')
  @ApiOperation({ summary: 'Получить публичный профиль пользователя' })
  @ApiResponse({ status: 200, description: 'Профиль получен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(+id);
  }
}
