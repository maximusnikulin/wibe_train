import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * ⚠️ MOCK SERVICE - FOR DEVELOPMENT ONLY ⚠️
 *
 * Это имитация реального API Тинькофф для разработки и тестирования.
 * В продакшене этот сервис должен быть заменён на реальный TinkoffService,
 * который работает с настоящим API Тинькофф через библиотеку или HTTP клиент.
 *
 * Особенности mock:
 * - Хранит данные в памяти (Map)
 * - Автоматически меняет статус платежей через таймауты
 * - Имитирует отправку webhook
 * - Генерирует случайные ID
 */

// Типы данных
interface PaymentData {
  paymentId: string;
  orderId: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: Date;
}

interface PayoutData {
  payoutId: string;
  amount: number;
  cardNumber: string;
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED';
  createdAt: Date;
}

@Injectable()
export class TinkoffMockService {
  private readonly logger = new Logger(TinkoffMockService.name);

  // Хранилище платежей и выплат в памяти
  private payments = new Map<string, PaymentData>();
  private payouts = new Map<string, PayoutData>();

  constructor(private readonly httpService: HttpService) {
    this.logger.warn('⚠️ USING MOCK TINKOFF SERVICE - NOT FOR PRODUCTION! ⚠️');
  }

  /**
   * Инициализация платежа (имитация)
   * В реальном API это был бы POST запрос к Тинькофф
   */
  async initPayment(amount: number, orderId: string) {
    const paymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const paymentUrl = `${process.env.FRONTEND_URL}/mock-payment/${paymentId}`;

    // Сохраняем данные о платеже
    const paymentData: PaymentData = {
      paymentId,
      orderId,
      amount,
      status: 'PENDING',
      createdAt: new Date(),
    };

    this.payments.set(paymentId, paymentData);

    this.logger.log(`[MOCK] Инициализирован платёж: ${paymentId}, сумма: ${amount} руб., orderId: ${orderId}`);

    return {
      success: true,
      payment_id: paymentId,
      payment_url: paymentUrl,
      order_id: orderId,
    };
  }

  /**
   * Проверка статуса платежа
   */
  async checkPaymentStatus(paymentId: string) {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      this.logger.warn(`[MOCK] Платёж не найден: ${paymentId}`);
      return {
        payment_id: paymentId,
        status: 'FAILED',
        amount: 0,
      };
    }

    this.logger.log(`[MOCK] Проверка статуса платежа: ${paymentId}, статус: ${payment.status}`);

    return {
      payment_id: payment.paymentId,
      status: payment.status,
      amount: payment.amount,
    };
  }

  /**
   * Инициализация выплаты (вывод средств)
   */
  async initPayout(amount: number, cardNumber: string) {
    const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Маскируем номер карты
    const maskedCard = this.maskCardNumber(cardNumber);

    const payoutData: PayoutData = {
      payoutId,
      amount,
      cardNumber: maskedCard,
      status: 'PROCESSING',
      createdAt: new Date(),
    };

    this.payouts.set(payoutId, payoutData);

    this.logger.log(`[MOCK] Инициализирована выплата: ${payoutId}, сумма: ${amount} руб., карта: ${maskedCard}`);

    // Автоматически завершаем выплату через 7 секунд
    setTimeout(() => {
      this.autoCompletePayout(payoutId);
    }, 7000);

    return {
      success: true,
      payout_id: payoutId,
      status: 'PROCESSING',
      amount: amount,
    };
  }

  /**
   * Имитация отправки webhook от Тинькофф
   * В реальности webhook приходит от Тинькофф на наш endpoint
   */
  async simulateWebhook(paymentId: string, status: 'SUCCESS' | 'FAILED') {
    this.logger.log(`[MOCK] Имитация webhook для платежа ${paymentId} со статусом ${status}`);

    // Задержка 3 секунды перед отправкой webhook
    setTimeout(async () => {
      const payment = this.payments.get(paymentId);

      if (!payment) {
        this.logger.error(`[MOCK] Платёж не найден для webhook: ${paymentId}`);
        return;
      }

      const webhookData = {
        payment_id: paymentId,
        order_id: payment.orderId,
        amount: payment.amount,
        status: status,
        timestamp: new Date().toISOString(),
      };

      try {
        // Отправляем webhook на наш сервер
        const response = await firstValueFrom(
          this.httpService.post('http://localhost:3001/api/webhooks/tinkoff', webhookData)
        );

        this.logger.log(`[MOCK] Webhook успешно отправлен: ${paymentId}`);
      } catch (error) {
        this.logger.error(`[MOCK] Ошибка отправки webhook: ${error.message}`);
      }
    }, 3000);
  }

  /**
   * Подтверждение платежа с указанным статусом
   * @param paymentId - ID платежа
   * @param status - статус платежа (SUCCESS или FAILED)
   */
  confirmPayment(paymentId: string, status: 'SUCCESS' | 'FAILED') {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      this.logger.warn(`[MOCK] Платёж не найден: ${paymentId}`);
      return { success: false, message: 'Payment not found' };
    }

    if (payment.status !== 'PENDING') {
      this.logger.warn(`[MOCK] Платёж уже обработан: ${paymentId}, статус: ${payment.status}`);
      return { success: false, message: 'Payment already processed' };
    }

    payment.status = status;
    this.payments.set(paymentId, payment);

    const isSuccess = status === 'SUCCESS';
    this.logger.log(`[MOCK] Платёж ${isSuccess ? 'подтверждён' : 'отклонён'}: ${paymentId}`);

    // Имитируем отправку webhook
    this.simulateWebhook(paymentId, payment.status);

    return { success: true, status: payment.status };
  }

  /**
   * Автоматическое завершение выплаты
   */
  private async autoCompletePayout(payoutId: string) {
    const payout = this.payouts.get(payoutId);

    if (!payout || payout.status !== 'PROCESSING') {
      return;
    }

    // Случайно: 95% успех, 5% ошибка
    const isSuccess = Math.random() > 0.05;

    payout.status = isSuccess ? 'SUCCESS' : 'FAILED';
    this.payouts.set(payoutId, payout);

    this.logger.log(`[MOCK] Выплата ${isSuccess ? 'завершена' : 'отклонена'}: ${payoutId}`);

    // Отправляем webhook для выплаты
    await this.simulatePayoutWebhook(payoutId, payout.status);
  }

  /**
   * Имитация отправки webhook для выплат
   */
  private async simulatePayoutWebhook(payoutId: string, status: 'SUCCESS' | 'FAILED') {
    this.logger.log(`[MOCK] Имитация webhook для выплаты ${payoutId} со статусом ${status}`);

    // Задержка 3 секунды перед отправкой webhook
    setTimeout(async () => {
      const payout = this.payouts.get(payoutId);

      if (!payout) {
        this.logger.error(`[MOCK] Выплата не найдена для webhook: ${payoutId}`);
        return;
      }

      const webhookData = {
        payment_id: payoutId,
        order_id: payoutId, // для выплат можно использовать payout_id
        amount: payout.amount,
        status: status,
        timestamp: new Date().toISOString(),
      };

      try {
        // Отправляем webhook на наш сервер
        const response = await firstValueFrom(
          this.httpService.post('http://localhost:3001/api/webhooks/tinkoff', webhookData)
        );

        this.logger.log(`[MOCK] Webhook для выплаты успешно отправлен: ${payoutId}`);
      } catch (error) {
        this.logger.error(`[MOCK] Ошибка отправки webhook для выплаты: ${error.message}`);
      }
    }, 3000);
  }

  /**
   * Маскирование номера карты
   */
  private maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 4) {
      return '****';
    }

    const first4 = cardNumber.substring(0, 4);
    const last4 = cardNumber.substring(cardNumber.length - 4);
    return `${first4} **** **** ${last4}`;
  }

  /**
   * Получить все платежи (для отладки)
   */
  getAllPayments() {
    return Array.from(this.payments.values());
  }

  /**
   * Получить все выплаты (для отладки)
   */
  getAllPayouts() {
    return Array.from(this.payouts.values());
  }

  /**
   * Очистить все данные (для тестов)
   */
  clearAll() {
    this.payments.clear();
    this.payouts.clear();
    this.logger.log('[MOCK] Все данные очищены');
  }
}
