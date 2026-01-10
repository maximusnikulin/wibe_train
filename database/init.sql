- Этот файл автоматически выполнится при первом запуске MySQL

-- Создание базы данных (уже создана через docker-compose)
USE betting_platform;

-- Таблицы создаст TypeORM автоматически через synchronize: true
-- Но можем добавить начальные данные

-- Создание тестового администратора
INSERT INTO users (email, password, firstName, lastName, role, balance, createdAt, updatedAt, isAdmin)
VALUES
    ('admin@example.com', '$2b$10$.LLR3QY5TAtj7JBfTS/eEennKv3uxEEzBzXBFcEkKCYiSs6VzwkUO', 'Admin','Admin', 'fan', 0, NOW(), NOW(), 1)
ON DUPLICATE KEY UPDATE id=id;

-- Можно добавить больше seed данных если нужно