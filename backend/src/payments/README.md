# Payment Module

Модуль для работы с платежами: пополнение счёта и вывод средств через Тинькофф.

## Структура

```
payments/
├── dto/
│   ├── init-deposit.dto.ts          # DTO для пополнения
│   ├── init-withdrawal.dto.ts       # DTO для вывода
│   └── tinkoff-webhook.dto.ts       # DTO для webhook
├── payment.service.ts               # Бизнес-логика платежей
├── payment.controller.ts            # REST API endpoints
├── payment.module.ts                # Модуль
└── README.md
```

## API Endpoints

### 1. POST /api/payments/deposit
Инициализация пополнения счёта.

**Request:**
```json
{
  "amount": 1000
}
```

**Response:** `201 Created`
```json
{
  "payment_id": 42,
  "payment_url": "http://localhost:3001/mock-payment/mock_1234567890_abc",
  "amount": 1000
}
```

**Требования:**
- Авторизация: JWT
- Минимальная сумма: 100 руб.

### 2. POST /api/webhooks/tinkoff
Единый webhook от Тинькофф для уведомлений о платежах.

**Request:**
```json
{
  "payment_id": "mock_1234567890_abc",
  "order_id": "42",
  "amount": 1000,
  "status": "SUCCESS",
  "timestamp": "2024-01-08T12:00:05.000Z"
}
```

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Примечание:**
- Этот endpoint НЕ требует авторизации (вызывается Тинькофф)
- Автоматически определяет тип операции: если payment_id начинается с "payout_" - выплата, иначе - пополнение
- TODO: В продакшене добавить проверку подписи запроса

### 3. GET /api/payments/:id/status
Получить статус платежа по ID.

**Response:** `200 OK`
```json
{
  "id": 42,
  "userId": 1,
  "amount": 1000,
  "currency": "RUB",
  "type": "deposit",
  "paymentMethod": "card",
  "status": "completed",
  "externalId": "mock_1234567890_abc",
  "paymentUrl": "http://localhost:3001/mock-payment/...",
  "transactionId": 15,
  "createdAt": "2024-01-08T12:00:00.000Z",
  "updatedAt": "2024-01-08T12:00:05.000Z"
}
```

**Требования:**
- Авторизация: JWT
- Можно получить только свои платежи

### 4. POST /api/payments/withdraw
Инициализация вывода средств на карту (только для участников).

**Request:**
```json
{
  "amount": 500,
  "cardNumber": "1234567890123456"
}
```

**Response:** `201 Created`
```json
{
  "payout_id": 43,
  "status": "PROCESSING"
}
```

**Требования:**
- Авторизация: JWT
- Роль: PARTICIPANT (только участники могут выводить средства)
- Минимальная сумма: 100 руб.
- На балансе должна быть достаточная сумма

**Errors:**
- `403 Forbidden` - если пользователь не является участником

### 5. GET /api/payments/history?limit=50
Получить список платежей текущего пользователя.

**Query параметры:**
- `limit` - количество записей (по умолчанию 50)

**Response:** `200 OK`
```json
[
  {
    "id": 43,
    "type": "withdrawal",
    "amount": 500,
    "status": "completed",
    "cardMask": "1234 **** **** 3456",
    "createdAt": "2024-01-08T13:00:00.000Z"
  },
  {
    "id": 42,
    "type": "deposit",
    "amount": 1000,
    "status": "completed",
    "createdAt": "2024-01-08T12:00:00.000Z"
  }
]
```

**Требования:**
- Авторизация: JWT
- Сортировка: по created_at DESC

## Бизнес-логика

### Пополнение счёта (Deposit)

**Последовательность:**

1. Пользователь вызывает `POST /api/payments/deposit`
2. Создаётся Payment с `status: PENDING`
3. Инициируется платёж в Тинькофф Mock Service
4. Возвращается `payment_url` для оплаты
5. Пользователь переходит по ссылке и "оплачивает"
6. Через 5 секунд Mock Service отправляет webhook
7. `processWebhook()` обрабатывает уведомление:
   - Обновляет `payment.status = COMPLETED`
   - Создаёт Transaction
   - Увеличивает `user.balance`
   - Связывает Payment с Transaction

**Транзакция БД:**
- ✅ Используется для атомарности операций
- ✅ Rollback при ошибках

### Вывод средств (Withdrawal)

**Последовательность:**

1. Пользователь вызывает `POST /api/payments/withdrawal`
2. Проверяется баланс пользователя
3. **В транзакции:**
   - Создаётся Payment с `status: PROCESSING`
   - Создаётся Transaction (списание)
   - Уменьшается `user.balance`
4. Инициируется выплата в Тинькофф Mock Service
5. Через 7 секунд Mock Service отправляет webhook
6. `processPayoutWebhook()` обрабатывает уведомление:
   - **Если SUCCESS:** Payment.status = COMPLETED
   - **Если FAILED:**
     - Возвращает деньги на баланс
     - Создаёт компенсирующую Transaction
     - Payment.status = FAILED

**Откат при ошибке:**
- ✅ Деньги возвращаются автоматически
- ✅ Создаётся запись о возврате

## Статусы платежей

### PaymentStatus
- `PENDING` - ожидает оплаты (для пополнений)
- `PROCESSING` - в процессе обработки (для выводов)
- `COMPLETED` - успешно завершён
- `FAILED` - ошибка/отклонён
- `CANCELLED` - отменён

### PaymentType
- `DEPOSIT` - пополнение счёта
- `WITHDRAWAL` - вывод средств

## Примеры использования

### Сценарий 1: Пополнение счёта

```bash
# 1. Инициализация пополнения
curl -X POST http://localhost:3001/api/payments/deposit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'

# Response:
# {
#   "payment_id": 42,
#   "payment_url": "http://localhost:3001/mock-payment/mock_1234567890_abc"
# }

# 2. Пользователь переходит по payment_url и "оплачивает"

# 3. Через 5 секунд автоматически придёт webhook (в mock режиме)

# 4. Проверить статус платежа
curl -X GET http://localhost:3001/api/payments/42/status \
  -H "Authorization: Bearer <token>"

# Response:
# {
#   "id": 42,
#   "status": "completed",
#   "amount": 1000
# }
```

### Сценарий 2: Вывод средств (только для участников)

```bash
# 1. Инициализация вывода
curl -X POST http://localhost:3001/api/payments/withdraw \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "cardNumber": "1234567890123456"
  }'

# Response:
# {
#   "payout_id": 43,
#   "status": "PROCESSING"
# }

# 2. Через 7 секунд автоматически придёт webhook (в mock режиме)

# 3. Проверить статус выплаты
curl -X GET http://localhost:3001/api/payments/43/status \
  -H "Authorization: Bearer <token>"

# Response:
# {
#   "id": 43,
#   "status": "completed",
#   "amount": 500,
#   "cardMask": "1234 **** **** 3456"
# }
```

### Сценарий 3: История платежей

```bash
curl -X GET "http://localhost:3001/api/payments/history?limit=10" \
  -H "Authorization: Bearer <token>"
```

## Обработка ошибок

Все ошибки логируются и возвращаются в стандартном формате:

```json
{
  "statusCode": 400,
  "message": "Недостаточно средств на счёте",
  "error": "Bad Request"
}
```

**Типы ошибок:**
- `400 Bad Request` - некорректные данные (мало средств, минимальная сумма и т.д.)
- `404 Not Found` - платёж или пользователь не найден
- `500 Internal Server Error` - ошибка обработки транзакции

## Логирование

Все операции логируются с указанием:
- ID пользователя
- ID платежа
- Суммы операции
- Результата

**Пример логов:**
```
[PaymentService] Инициализация пополнения для пользователя 1 на сумму 1000 руб.
[PaymentService] Платёж 42 инициализирован, external_id: mock_1234567890_abc
[PaymentService] Получен webhook: payment_id=mock_1234567890_abc, status=SUCCESS
[PaymentService] Обработка успешного платежа 42
[PaymentService] Платёж 42 успешно обработан. Баланс пользователя 1: 0 -> 1000
```

## Безопасность

1. **JWT авторизация** для всех endpoint'ов (кроме webhooks)
2. **Изоляция данных** - пользователь видит только свои платежи
3. **Транзакции БД** - атомарность операций с балансом
4. **Валидация данных** - через class-validator
5. **Маскирование карт** - хранятся только первые 4 и последние 4 цифры

## Mock vs Production

В текущей реализации используется `TinkoffMockService`.

Для перехода на production:
1. Создайте `TinkoffService` с реальным API
2. Замените в `PaymentModule`:
   ```typescript
   providers: [
     {
       provide: 'TINKOFF_SERVICE',
       useClass: process.env.NODE_ENV === 'production'
         ? TinkoffService
         : TinkoffMockService,
     },
   ],
   ```
3. Обновите webhook URL в настройках Тинькофф

## Тестирование

В mock режиме можно тестировать различные сценарии:

```typescript
// В PaymentService можно добавить метод для тестов
async simulatePaymentSuccess(paymentId: number) {
  const payment = await this.paymentRepository.findOne({
    where: { id: paymentId }
  });

  await this.processWebhook({
    payment_id: payment.externalId,
    order_id: payment.id.toString(),
    amount: payment.amount,
    status: TinkoffWebhookStatus.SUCCESS,
  });
}
```

## Роли пользователей (RBAC)

### UserRole.FAN (болельщик)
**Доступные операции:**
- ✅ Пополнение счёта (`POST /api/payments/deposit`)
- ✅ Просмотр истории платежей (`GET /api/payments/history`)
- ✅ Проверка статуса платежей (`GET /api/payments/:id/status`)
- ❌ Вывод средств (`POST /api/payments/withdraw`) - **ЗАПРЕЩЕНО**

### UserRole.PARTICIPANT (участник)
**Доступные операции:**
- ✅ Пополнение счёта (`POST /api/payments/deposit`)
- ✅ **Вывод средств** (`POST /api/payments/withdraw`) - **РАЗРЕШЕНО**
- ✅ Просмотр истории платежей (`GET /api/payments/history`)
- ✅ Проверка статуса платежей (`GET /api/payments/:id/status`)

**Проверка роли:**
```typescript
@Post('withdraw')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARTICIPANT) // Только участники!
async initWithdrawal(@Request() req, @Body() dto: InitWithdrawalDto) {
  return this.paymentService.initWithdrawal(req.user.id, dto.amount, dto.cardNumber);
}
```

**Ответ при недостаточных правах:**
```json
{
  "statusCode": 403,
  "message": "Недостаточно прав для выполнения этой операции",
  "error": "Forbidden"
}
```
