- Этот файл автоматически выполнится при первом запуске MySQL

-- Создание базы данных (уже создана через docker-compose)
USE betting_platform;

-- Таблицы создаст TypeORM автоматически через synchronize: true
-- Но можем добавить начальные данные

-- Создание тестового администратора
INSERT INTO users (email, password_hash, username, role, balance, created_at, updated_at) 
VALUES 
  ('admin@example.com', '$2b$10$YourHashedPassword', 'Admin', 'participant', 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE id=id;

-- Можно добавить больше seed данных если нужно