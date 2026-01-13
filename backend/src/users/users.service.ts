import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Получить пользователя по ID
  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  // Получить баланс пользователя
  async getBalance(userId: number): Promise<{ balance: number }> {
    const user = await this.findOne(userId);
    return { balance: user.balance };
  }

  // Пополнить баланс пользователя
  async addBalance(userId: number, amount: number): Promise<User> {
    const user = await this.findOne(userId);
    user.balance = Number(user.balance) + amount;
    return this.usersRepository.save(user);
  }

  // Списать с баланса (для ставок)
  async subtractBalance(userId: number, amount: number): Promise<User> {
    const user = await this.findOne(userId);

    if (Number(user.balance) < amount) {
      throw new Error('Недостаточно средств');
    }

    user.balance = Number(user.balance) - amount;
    return this.usersRepository.save(user);
  }

  // Получить всех пользователей с ролью participant
  async findParticipants(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: UserRole.PARTICIPANT },
      select: ['id', 'email', 'firstName', 'lastName', 'role'],
    });
  }
}
