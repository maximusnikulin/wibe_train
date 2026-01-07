import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus, PaymentType } from '../transactions/entities/payment.entity';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { TinkoffMockService } from '../external-banking/tinkoff-mock.service';
import { TinkoffWebhookDto, TinkoffWebhookStatus } from './dto/tinkoff-webhook.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private tinkoffService: TinkoffMockService,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  /**
   * 1. Инициализация пополнения счёта
   */
  async initDeposit(userId: number, amount: number) {
    this.logger.log(`Инициализация пополнения для пользователя ${userId} на сумму ${amount} руб.`);

    try {
      // Валидация минимальной суммы
      if (amount < 100) {
        throw new BadRequestException('Минимальная сумма пополнения: 100 руб.');
      }

      // Проверяем существование пользователя
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('Пользователь не найден');
      }

      // Создаём запись о платеже
      const payment = this.paymentRepository.create({
        userId,
        amount,
        currency: 'RUB',
        type: PaymentType.DEPOSIT,
        paymentMethod: 'card',
        status: PaymentStatus.PENDING,
      });

      const savedPayment = await this.paymentRepository.save(payment);

      // Инициализируем платёж через Тинькофф
      const tinkoffResponse = await this.tinkoffService.initPayment(
        amount,
        savedPayment.id.toString(),
      );

      // Обновляем платёж с данными от Тинькофф
      savedPayment.externalId = tinkoffResponse.payment_id;
      savedPayment.paymentUrl = tinkoffResponse.payment_url;
      await this.paymentRepository.save(savedPayment);

      this.logger.log(`Платёж ${savedPayment.id} инициализирован, external_id: ${tinkoffResponse.payment_id}`);

      return {
        payment_id: savedPayment.id,
        payment_url: tinkoffResponse.payment_url,
      };
    } catch (error) {
      this.logger.error(`Ошибка инициализации платежа: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 2. Обработка webhook от Тинькофф для пополнения
   */
  async processWebhook(webhookData: TinkoffWebhookDto) {
    this.logger.log(`Получен webhook: payment_id=${webhookData.payment_id}, status=${webhookData.status}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Находим платёж по external_id
      const payment = await this.paymentRepository.findOne({
        where: { externalId: webhookData.payment_id },
        relations: ['user'],
      });

      if (!payment) {
        this.logger.warn(`Платёж не найден: external_id=${webhookData.payment_id}`);
        throw new NotFoundException('Платёж не найден');
      }

      // Проверяем, что платёж в статусе pending
      if (payment.status !== PaymentStatus.PENDING) {
        this.logger.warn(`Платёж ${payment.id} уже обработан, статус: ${payment.status}`);
        await queryRunner.release();
        return { success: true, message: 'Платёж уже обработан' };
      }

      // Обработка успешного платежа
      if (webhookData.status === TinkoffWebhookStatus.SUCCESS) {
        this.logger.log(`Обработка успешного платежа ${payment.id}`);

        // Получаем пользователя
        const user = await queryRunner.manager.findOne(User, {
          where: { id: payment.userId },
        });

        if (!user) {
          throw new NotFoundException('Пользователь не найден');
        }

        const balanceBefore = Number(user.balance);
        const balanceAfter = balanceBefore + payment.amount;

        // Создаём транзакцию
        const transaction = queryRunner.manager.create(Transaction, {
          userId: user.id,
          type: TransactionType.DEPOSIT,
          amount: payment.amount,
          balanceAfter: balanceAfter,
          description: `Пополнение счёта через Тинькофф на сумму ${payment.amount} руб.`,
          paymentId: payment.id,
        });

        const savedTransaction = await queryRunner.manager.save(transaction);

        // Обновляем баланс пользователя
        user.balance = balanceAfter;
        await queryRunner.manager.save(user);

        // Обновляем платёж
        payment.status = PaymentStatus.COMPLETED;
        payment.transactionId = savedTransaction.id;
        await queryRunner.manager.save(payment);

        await queryRunner.commitTransaction();

        this.logger.log(
          `Платёж ${payment.id} успешно обработан. Баланс пользователя ${user.id}: ${balanceBefore} -> ${balanceAfter}`,
        );
      }
      // Обработка неудачного платежа
      else if (webhookData.status === TinkoffWebhookStatus.FAILED) {
        this.logger.log(`Обработка неудачного платежа ${payment.id}`);

        payment.status = PaymentStatus.FAILED;
        payment.errorMessage = webhookData.error_message || 'Платёж отклонён банком';
        await queryRunner.manager.save(payment);

        await queryRunner.commitTransaction();

        this.logger.warn(`Платёж ${payment.id} отклонён: ${payment.errorMessage}`);
      }

      await queryRunner.release();
      return { success: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.logger.error(`Ошибка обработки webhook: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка обработки платежа');
    }
  }

  /**
   * 3. Получить статус платежа
   */
  async getPaymentStatus(paymentId: number, userId: number) {
    this.logger.log(`Запрос статуса платежа ${paymentId} для пользователя ${userId}`);

    try {
      const payment = await this.paymentRepository.findOne({
        where: { id: paymentId, userId },
        relations: ['transaction'],
      });

      if (!payment) {
        throw new NotFoundException('Платёж не найден');
      }

      return payment;
    } catch (error) {
      this.logger.error(`Ошибка получения статуса платежа: ${error.message}`);
      throw error;
    }
  }

  /**
   * 4. Инициализация вывода средств
   */
  async initWithdrawal(userId: number, amount: number, cardNumber: string) {
    this.logger.log(`Инициализация вывода для пользователя ${userId} на сумму ${amount} руб.`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Валидация минимальной суммы
      if (amount < 100) {
        throw new BadRequestException('Минимальная сумма вывода: 100 руб.');
      }

      // Получаем пользователя
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Пользователь не найден');
      }

      // Проверяем баланс
      const currentBalance = Number(user.balance);
      if (currentBalance < amount) {
        throw new BadRequestException('Недостаточно средств на счёте');
      }

      const balanceAfter = currentBalance - amount;

      // Маскируем номер карты
      const maskedCard = this.maskCardNumber(cardNumber);

      // Создаём запись о выплате
      const payment = queryRunner.manager.create(Payment, {
        userId,
        amount,
        currency: 'RUB',
        type: PaymentType.WITHDRAWAL,
        paymentMethod: 'card',
        status: PaymentStatus.PROCESSING,
        cardMask: maskedCard,
      });

      const savedPayment = await queryRunner.manager.save(payment);

      // Создаём транзакцию списания
      const transaction = queryRunner.manager.create(Transaction, {
        userId: user.id,
        type: TransactionType.BET, // Используем BET как тип для списания при выводе
        amount: amount,
        balanceAfter: balanceAfter,
        description: `Вывод средств на карту ${maskedCard} на сумму ${amount} руб.`,
        paymentId: savedPayment.id,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      // Обновляем баланс пользователя
      user.balance = balanceAfter;
      await queryRunner.manager.save(user);

      // Связываем платёж с транзакцией
      savedPayment.transactionId = savedTransaction.id;
      await queryRunner.manager.save(savedPayment);

      await queryRunner.commitTransaction();

      // Инициируем выплату через Тинькофф (после коммита транзакции)
      const tinkoffResponse = await this.tinkoffService.initPayout(amount, cardNumber);

      // Обновляем external_id
      savedPayment.externalId = tinkoffResponse.payout_id;
      await this.paymentRepository.save(savedPayment);

      await queryRunner.release();

      this.logger.log(
        `Вывод ${savedPayment.id} инициализирован, external_id: ${tinkoffResponse.payout_id}`,
      );

      return {
        payout_id: savedPayment.id,
        status: tinkoffResponse.status,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.logger.error(`Ошибка инициализации вывода: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 5. Обработка webhook для вывода средств
   */
  async processPayoutWebhook(webhookData: TinkoffWebhookDto) {
    this.logger.log(`Получен webhook выплаты: payout_id=${webhookData.payment_id}, status=${webhookData.status}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Находим платёж по external_id
      const payment = await this.paymentRepository.findOne({
        where: { externalId: webhookData.payment_id },
        relations: ['user', 'transaction'],
      });

      if (!payment) {
        this.logger.warn(`Выплата не найдена: external_id=${webhookData.payment_id}`);
        throw new NotFoundException('Выплата не найдена');
      }

      // Обработка успешной выплаты
      if (webhookData.status === TinkoffWebhookStatus.SUCCESS) {
        this.logger.log(`Обработка успешной выплаты ${payment.id}`);

        payment.status = PaymentStatus.COMPLETED;
        await queryRunner.manager.save(payment);

        await queryRunner.commitTransaction();

        this.logger.log(`Выплата ${payment.id} успешно завершена`);
      }
      // Обработка неудачной выплаты - откатываем деньги
      else if (webhookData.status === TinkoffWebhookStatus.FAILED) {
        this.logger.log(`Обработка неудачной выплаты ${payment.id}, откат средств`);

        // Получаем пользователя и транзакцию
        const user = await queryRunner.manager.findOne(User, {
          where: { id: payment.userId },
        });

        if (!user) {
          throw new NotFoundException('Пользователь не найден');
        }

        // Возвращаем деньги на баланс
        user.balance = Number(user.balance) + payment.amount;
        await queryRunner.manager.save(user);

        // Обновляем статус платежа
        payment.status = PaymentStatus.FAILED;
        payment.errorMessage = webhookData.error_message || 'Выплата отклонена банком';
        await queryRunner.manager.save(payment);

        // Создаём компенсирующую транзакцию возврата
        const refundTransaction = queryRunner.manager.create(Transaction, {
          userId: user.id,
          type: TransactionType.BET_REFUND,
          amount: payment.amount,
          balanceAfter: Number(user.balance),
          description: `Возврат средств после неудачной выплаты #${payment.id}`,
          paymentId: payment.id,
        });

        await queryRunner.manager.save(refundTransaction);

        await queryRunner.commitTransaction();

        this.logger.warn(
          `Выплата ${payment.id} отклонена, средства возвращены. Новый баланс: ${user.balance}`,
        );
      }

      await queryRunner.release();
      return { success: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.logger.error(`Ошибка обработки webhook выплаты: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка обработки выплаты');
    }
  }

  /**
   * 6. Получить список платежей пользователя
   */
  async getUserPayments(userId: number, limit: number = 50) {
    this.logger.log(`Запрос списка платежей для пользователя ${userId}, лимит: ${limit}`);

    try {
      const payments = await this.paymentRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
        relations: ['transaction'],
      });

      return payments;
    } catch (error) {
      this.logger.error(`Ошибка получения списка платежей: ${error.message}`);
      throw new InternalServerErrorException('Ошибка получения списка платежей');
    }
  }

  /**
   * Вспомогательный метод: маскирование номера карты
   */
  private maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 4) {
      return '****';
    }

    const first4 = cardNumber.substring(0, 4);
    const last4 = cardNumber.substring(cardNumber.length - 4);
    return `${first4} **** **** ${last4}`;
  }
}
