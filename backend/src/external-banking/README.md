# External Banking Module

Модуль для интеграции с внешними банковскими и платёжными системами.

## Структура

```
external-banking/
├── tinkoff-mock.service.ts   # Mock сервис для разработки
├── external-banking.module.ts # Модуль
└── README.md
```

## TinkoffMockService

⚠️ **ВАЖНО**: Это Mock сервис только для разработки и тестирования!

### Возможности

- Имитация инициализации платежа
- Проверка статуса платежа
- Имитация выплат на карту
- Автоматическая отправка webhook
- Хранение состояний в памяти (Map)

### Методы

#### 1. initPayment(amount, orderId)
Инициализирует платёж и возвращает URL для оплаты.

```typescript
const result = await tinkoffMock.initPayment(1000, 'order_123');
// {
//   success: true,
//   payment_id: 'mock_1234567890_abc',
//   payment_url: 'http://localhost:3001/mock-payment/mock_1234567890_abc',
//   order_id: 'order_123'
// }
```

**Особенности:**
- Автоматически меняет статус на CONFIRMED через 5 секунд (90% успех)
- Отправляет webhook на `/api/webhooks/tinkoff` через 8 секунд

#### 2. checkPaymentStatus(paymentId)
Проверяет текущий статус платежа.

```typescript
const status = await tinkoffMock.checkPaymentStatus('mock_1234567890_abc');
// {
//   payment_id: 'mock_1234567890_abc',
//   status: 'CONFIRMED',
//   amount: 1000
// }
```

**Статусы:**
- `PENDING` - ожидает оплаты
- `CONFIRMED` - успешно оплачен
- `REJECTED` - отклонён

#### 3. initPayout(amount, cardNumber)
Инициализирует выплату на карту.

```typescript
const payout = await tinkoffMock.initPayout(500, '1234567890123456');
// {
//   success: true,
//   payout_id: 'payout_1234567890_xyz',
//   status: 'PROCESSING',
//   amount: 500
// }
```

**Особенности:**
- Маскирует номер карты (1234 **** **** 3456)
- Автоматически завершает выплату через 7 секунд (95% успех)

#### 4. simulateWebhook(paymentId, status)
Ручная отправка webhook для тестирования.

```typescript
await tinkoffMock.simulateWebhook('mock_1234567890_abc', 'SUCCESS');
```

**Статусы:**
- `SUCCESS` - успешная оплата
- `FAILED` - неудачная оплата

Webhook отправляется на `/api/webhooks/tinkoff` через 3 секунды.

### Использование

```typescript
import { TinkoffMockService } from './external-banking/tinkoff-mock.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly tinkoffMock: TinkoffMockService,
  ) {}

  async createPayment(amount: number, orderId: string) {
    // Инициализируем платёж
    const payment = await this.tinkoffMock.initPayment(amount, orderId);

    // Перенаправляем пользователя на payment_url
    return payment;
  }

  async checkStatus(paymentId: string) {
    return this.tinkoffMock.checkPaymentStatus(paymentId);
  }
}
```

## Переход на Production

В продакшене замените `TinkoffMockService` на реальный сервис:

```typescript
// tinkoff.service.ts
@Injectable()
export class TinkoffService {
  async initPayment(amount: number, orderId: string) {
    // Реальный запрос к API Тинькофф
    const response = await axios.post('https://securepay.tinkoff.ru/v2/Init', {
      TerminalKey: process.env.TINKOFF_TERMINAL_KEY,
      Amount: amount * 100, // в копейках
      OrderId: orderId,
      // ... другие параметры
    });

    return response.data;
  }

  // ... остальные методы
}
```

Обновите модуль:

```typescript
@Module({
  providers: [
    {
      provide: 'TINKOFF_SERVICE',
      useClass: process.env.NODE_ENV === 'production'
        ? TinkoffService
        : TinkoffMockService,
    },
  ],
})
export class ExternalBankingModule {}
```

## Отладка

Для отладки доступны дополнительные методы:

```typescript
// Получить все платежи
const allPayments = tinkoffMock.getAllPayments();

// Получить все выплаты
const allPayouts = tinkoffMock.getAllPayouts();

// Очистить всё (для тестов)
tinkoffMock.clearAll();
```

## Логирование

Все действия логируются в консоль с префиксом `[MOCK]`:

```
[TinkoffMockService] ⚠️ USING MOCK TINKOFF SERVICE - NOT FOR PRODUCTION! ⚠️
[TinkoffMockService] [MOCK] Инициализирован платёж: mock_1234567890_abc, сумма: 1000 руб.
[TinkoffMockService] [MOCK] Платёж автоматически подтверждён: mock_1234567890_abc
[TinkoffMockService] [MOCK] Webhook успешно отправлен: mock_1234567890_abc
```
