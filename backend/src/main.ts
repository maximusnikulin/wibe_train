import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Включаем CORS для фронтенда
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Включаем глобальную валидацию через class-validator
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Удаляет поля, которых нет в DTO
    forbidNonWhitelisted: true, // Выбрасывает ошибку при неизвестных полях
    transform: true, // Автоматически преобразует типы
  }));

  // Устанавливаем глобальный префикс для всех роутов
  app.setGlobalPrefix('api');

  // Настройка Swagger документации
  const config = new DocumentBuilder()
    .setTitle('Betting System API')
    .setDescription('API для системы ставок на спортивные состязания')
    .setVersion('1.0')
    .addTag('auth', 'Авторизация и регистрация')
    .addTag('users', 'Управление пользователями')
    .addTag('competitions', 'Управление состязаниями')
    .addTag('bets', 'Управление ставками')
    .addTag('transactions', 'История транзакций')
    .addTag('payments', 'Платежи и выплаты')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Введите JWT токен',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Приложение запущено на порту ${port}`);
  console.log(`Swagger документация доступна по адресу: http://localhost:${port}/api/docs`);
  console.log(`Swagger JSON для Postman: http://localhost:${port}/api/docs-json`);
}

bootstrap();
