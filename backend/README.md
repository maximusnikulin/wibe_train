# Betting System Backend

NestJS бэкенд для системы ставок на спортивные состязания.

## Возможности

- JWT аутентификация
- Управление пользователями (болельщики и участники)
- Создание и управление состязаниями
- Система ставок с автоматическим расчётом выигрышей
- Управление балансом и транзакциями
- История операций

## Технологии

- NestJS 10
- TypeORM
- MySQL
- JWT (Passport)
- bcrypt
- class-validator

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте базу данных MySQL:
```sql
CREATE DATABASE betting_system;
```

3. Скопируйте `.env.example` в `.env` и настройте переменные окружения:
```bash
cp .env.example.example .env.example
```

4. Отредактируйте `.env` файл с вашими настройками базы данных.

## Запуск

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

Приложение запустится на порту 3001 (или на порту из переменной PORT).

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход пользователя

### Пользователи
- `GET /api/users/me` - Получить профиль текущего пользователя
- `GET /api/users/balance` - Получить баланс

### Состязания
- `GET /api/competitions` - Список всех состязаний
- `GET /api/competitions/:id` - Получить состязание по ID
- `POST /api/competitions` - Создать состязание (требует авторизации)
- `PATCH /api/competitions/:id` - Обновить состязание (требует авторизации)
- `DELETE /api/competitions/:id` - Удалить состязание (требует авторизации)
- `GET /api/competitions/:id/participants` - Получить участников состязания

### Ставки
- `POST /api/bets` - Создать ставку (требует авторизации)
- `GET /api/bets` - Получить все ставки текущего пользователя
- `GET /api/bets/:id` - Получить ставку по ID

### Транзакции
- `POST /api/transactions/deposit` - Пополнить счёт
- `GET /api/transactions` - Получить историю транзакций

## Структура проекта

```
backend/
├── src/
│   ├── auth/              # Модуль аутентификации (JWT)
│   ├── users/             # Модуль пользователей
│   ├── competitions/      # Модуль состязаний
│   ├── bets/              # Модуль ставок
│   ├── transactions/      # Модуль транзакций
│   ├── app.module.ts      # Главный модуль приложения
│   └── main.ts            # Точка входа
├── .env.example           # Пример переменных окружения
├── package.json
└── tsconfig.json
```

## Примеры запросов

### Регистрация
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Иван",
  "lastName": "Иванов",
  "role": "fan"
}
```

### Создание ставки
```bash
POST /api/bets
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "competitionId": 1,
  "participantId": 2,
  "amount": 10000
}
```

### Пополнение счёта
```bash
POST /api/transactions/deposit
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "amount": 50000
}
```

## Примечания

- Все суммы хранятся в копейках для точности расчётов
- JWT токен действителен 7 дней
- TypeORM автоматически создаёт таблицы при первом запуске (synchronize: true)
- В продакшене рекомендуется использовать миграции вместо synchronize
