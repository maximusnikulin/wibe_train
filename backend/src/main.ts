import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Приложение запущено на порту ${port}`);
}

bootstrap();
