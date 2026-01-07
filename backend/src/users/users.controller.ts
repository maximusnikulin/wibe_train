import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard) // Все роуты требуют аутентификации
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/users/balance - Получить баланс текущего пользователя
  @Get('balance')
  async getBalance(@Request() req) {
    return this.usersService.getBalance(req.user.id);
  }

  // GET /api/users/me - Получить информацию о текущем пользователе
  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);

    // Не возвращаем пароль
    const { password, ...result } = user;
    return result;
  }
}
