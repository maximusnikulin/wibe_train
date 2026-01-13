# Wibe - Платформа условного спонсорства

## Предметная область

**Wibe** — это платформа условного спонсорства спортсменов и участников соревнований.

### Ключевая механика
Деньги болельщика переходят участнику **только в случае победы**, иначе возвращаются обратно болельщику.

### Основные сущности

#### Пользователи
| Роль | Описание |
|------|----------|
| **Участник** (participant) | Спортсмен/конкурсант. Участвует в событиях, получает спонсорские деньги при победе |
| **Болельщик** (fan) | Спонсор. Поддерживает участников финансово, делая "ставки на победу" |
| **Администратор** (admin) | Управляет событиями, определяет победителей |

#### Объекты
| Сущность | Описание |
|----------|----------|
| **Событие** (BetEvent) | Соревнование с определённым исходом (победитель) |
| **Ставка** (Bet) | Обязательство болельщика перечислить деньги участнику при его победе |
| **Счёт** (balance) | Внутренний кошелёк пользователя на платформе |
| **Транзакция** (Transaction) | Запись о движении средств |
| **Платёж** (Payment) | Пополнение или вывод средств через внешнюю платёжную систему |

---

## Структура базы данных

### Таблица `users`
| Поле | Тип | Описание |
|------|-----|----------|
| id | int (PK) | ID пользователя |
| email | varchar (unique) | Email |
| password | varchar | Хешированный пароль |
| firstName | varchar | Имя |
| lastName | varchar | Фамилия |
| role | enum | Роль: `fan`, `participant`, `admin` |
| balance | int | Баланс (целое число, рубли) |
| createdAt | datetime | Дата создания |
| updatedAt | datetime | Дата обновления |

### Таблица `bet_events`
| Поле | Тип | Описание |
|------|-----|----------|
| id | int (PK) | ID события |
| title | varchar | Название |
| description | text | Описание |
| status | enum | Статус: `upcoming`, `active`, `finished`, `cancelled` |
| startDate | datetime | Дата начала |
| endDate | datetime | Дата окончания |
| winnerId | int (nullable) | ID победителя (userId) |
| createdAt | datetime | Дата создания |
| updatedAt | datetime | Дата обновления |

### Таблица `bet_event_participants`
| Поле | Тип | Описание |
|------|-----|----------|
| id | int (PK) | ID записи |
| betEventId | int (FK) | ID события |
| userId | int (FK) | ID пользователя-участника |
| additionalInfo | text | Дополнительная информация |
| createdAt | datetime | Дата создания |

### Таблица `bets`
| Поле | Тип | Описание |
|------|-----|----------|
| id | int (PK) | ID ставки |
| userId | int (FK) | ID болельщика |
| betEventId | int (FK) | ID события |
| participantId | int (FK) | ID записи участника (bet_event_participants.id) |
| amount | bigint | Сумма ставки |
| status | enum | Статус: `pending`, `won`, `lost`, `cancelled` |
| createdAt | datetime | Дата создания |
| updatedAt | datetime | Дата обновления |

### Таблица `transactions`
| Поле | Тип | Описание |
|------|-----|----------|
| id | int (PK) | ID транзакции |
| userId | int (FK) | ID пользователя |
| type | enum | Тип: `deposit`, `bet`, `winning`, `refund`, `bet_refund` |
| amount | int | Сумма |
| balanceAfter | int | Баланс после транзакции |
| description | text | Описание |
| betId | int (nullable) | ID связанной ставки |
| paymentId | int (nullable) | ID связанного платежа |
| createdAt | datetime | Дата создания |

### Таблица `payments`
| Поле | Тип | Описание |
|------|-----|----------|
| id | int (PK) | ID платежа |
| userId | int (FK) | ID пользователя |
| transactionId | int (FK, nullable) | ID транзакции |
| amount | int | Сумма |
| currency | varchar(3) | Валюта (RUB) |
| type | enum | Тип: `deposit`, `withdrawal` |
| paymentMethod | varchar(50) | Метод оплаты |
| externalId | varchar(255) | ID во внешней системе |
| paymentUrl | text | URL страницы оплаты |
| status | enum | Статус: `pending`, `processing`, `completed`, `failed`, `cancelled` |
| metadata | json | Дополнительные данные |
| cardMask | varchar(20) | Маска карты |
| errorMessage | text | Сообщение об ошибке |
| createdAt | datetime | Дата создания |
| updatedAt | datetime | Дата обновления |

---

## API Endpoints

### Auth (`/api/auth`)
| Метод | Endpoint | Описание | Auth |
|-------|----------|----------|------|
| POST | `/register` | Регистрация пользователя | - |
| POST | `/login` | Вход (возвращает JWT) | - |

### Users (`/api/users`)
| Метод | Endpoint | Описание | Auth |
|-------|----------|----------|------|
| GET | `/balance` | Получить баланс | JWT |
| GET | `/me` | Получить профиль | JWT |

### Bet Events (`/api/bet-events`)
| Метод | Endpoint | Описание | Auth | Роль |
|-------|----------|----------|------|------|
| GET | `/` | Получить все события | - | - |
| POST | `/` | Создать событие | JWT | - |
| GET | `/:id` | Получить событие по ID | - | - |
| PATCH | `/:id` | Обновить событие | JWT | - |
| DELETE | `/:id` | Удалить событие | JWT | - |
| GET | `/:id/participants` | Получить участников события | - | - |
| GET | `/my-participations` | События текущего участника со статистикой | JWT | participant |
| GET | `/participant/:userId` | События участника по userId | - | - |
| POST | `/end/:id/:winnerId` | Завершить событие (определить победителя) | JWT | admin |

### Bets (`/api/bets`)
| Метод | Endpoint | Описание | Auth |
|-------|----------|----------|------|
| POST | `/` | Создать ставку | JWT |
| GET | `/` | Получить ставки текущего пользователя | JWT |
| GET | `/:id` | Получить ставку по ID | JWT |

### Transactions (`/api/transactions`)
| Метод | Endpoint | Описание | Auth |
|-------|----------|----------|------|
| GET | `/` | История транзакций пользователя | JWT |

### Payments (`/api/payments`)
| Метод | Endpoint | Описание | Auth | Роль |
|-------|----------|----------|------|------|
| POST | `/deposit` | Инициировать пополнение | JWT | - |
| POST | `/withdraw` | Инициировать вывод средств | JWT | participant |
| GET | `/:id/status` | Статус платежа | JWT | - |
| GET | `/history` | История платежей | JWT | - |

---

## Бизнес-логика

### Процесс ставки
1. Болельщик выбирает событие и участника
2. Указывает сумму ставки
3. Сумма списывается с баланса болельщика
4. Создаётся запись ставки со статусом `pending`

### Завершение события
1. Администратор вызывает `POST /bet-events/end/:id/:winnerId`
2. Для всех ставок на это событие:
   - Если ставка на победителя (`won`): сумма переводится участнику-победителю
   - Если ставка не на победителя (`lost`): сумма возвращается болельщику

### Пополнение баланса
1. Болельщик инициирует пополнение (`POST /payments/deposit`)
2. Создаётся платёж, возвращается `payment_url`
3. После оплаты webhook обновляет статус
4. При успехе — зачисление на баланс

### Вывод средств (только участники)
1. Участник инициирует вывод (`POST /payments/withdraw`)
2. Сумма резервируется (списывается с баланса)
3. Обрабатывается внешней системой
4. При неудаче — возврат на баланс

---

## Технологический стек

### Backend
- **NestJS** — фреймворк
- **TypeORM** — ORM для работы с БД
- **MySQL** — база данных
- **JWT** — аутентификация
- **Swagger** — документация API (`/api/docs`)

### Frontend
- **React** + **TypeScript**
- **Vite** — сборка
- **React Query** — управление состоянием и кэширование
- **React Router** — роутинг

---

## Структура проекта

```
wibe_code_train/
├── backend/
│   └── src/
│       ├── auth/           # Аутентификация (JWT)
│       ├── users/          # Пользователи
│       ├── bet-events/     # События для ставок
│       ├── bets/           # Ставки
│       ├── transactions/   # Транзакции
│       ├── payments/       # Платежи
│       └── external-banking/ # Интеграция с внешней платёжкой
├── frontend/
│   └── src/
│       ├── pages/          # Страницы
│       ├── components/     # Компоненты
│       ├── contexts/       # React контексты (Auth)
│       ├── services/       # API клиент
│       └── types/          # TypeScript типы
└── claude.md               # Этот файл
```
