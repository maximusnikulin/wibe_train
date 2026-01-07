import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private usersService: UsersService,
  ) {}

  // Создать транзакцию пополнения
  async createDepositTransaction(userId: number, amount: number): Promise<Transaction> {
    // Пополняем баланс
    const user = await this.usersService.addBalance(userId, amount);

    // Создаём транзакцию
    const transaction = this.transactionsRepository.create({
      userId,
      type: TransactionType.DEPOSIT,
      amount,
      balanceAfter: user.balance,
      description: `Пополнение счёта на ${amount} коп.`,
    });

    return this.transactionsRepository.save(transaction);
  }

  // Создать транзакцию ставки
  async createBetTransaction(userId: number, amount: number, betId: number): Promise<Transaction> {
    const user = await this.usersService.findOne(userId);

    const transaction = this.transactionsRepository.create({
      userId,
      type: TransactionType.BET,
      amount,
      balanceAfter: user.balance,
      description: `Ставка на сумму ${amount} коп.`,
      betId,
    });

    return this.transactionsRepository.save(transaction);
  }

  // Создать транзакцию выигрыша
  async createWinningTransaction(userId: number, amount: number, betId: number): Promise<Transaction> {
    const user = await this.usersService.findOne(userId);

    const transaction = this.transactionsRepository.create({
      userId,
      type: TransactionType.WINNING,
      amount,
      balanceAfter: user.balance,
      description: `Выигрыш по ставке #${betId} на сумму ${amount} коп.`,
      betId,
    });

    return this.transactionsRepository.save(transaction);
  }

  // Создать транзакцию возврата
  async createRefundTransaction(userId: number, amount: number, betId: number): Promise<Transaction> {
    const user = await this.usersService.findOne(userId);

    const transaction = this.transactionsRepository.create({
      userId,
      type: TransactionType.REFUND,
      amount,
      balanceAfter: user.balance,
      description: `Возврат средств по ставке #${betId} на сумму ${amount} коп.`,
      betId,
    });

    return this.transactionsRepository.save(transaction);
  }

  // Получить историю транзакций пользователя
  async findByUser(userId: number): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // Получить транзакцию по ID
  async findOne(id: number): Promise<Transaction> {
    return this.transactionsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }
}
