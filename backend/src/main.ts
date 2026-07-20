import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Единый префикс для всех маршрутов: /api/...
  app.setGlobalPrefix('api');

  // Валидация тела запросов + отбрасывание лишних полей.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS для фронтенда (в dev по умолчанию открыт; в prod задаётся через CORS_ORIGIN).
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? true,
  });

  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);

  Logger.log(`API запущено на http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
