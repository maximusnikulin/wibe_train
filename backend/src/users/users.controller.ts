import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Получить баланс текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Баланс получен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getBalance(@Request() req) {
    return this.usersService.getBalance(req.user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Профиль получен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);

    // Не возвращаем пароль
    const { password, ...result } = user;
    return result;
  }
}
