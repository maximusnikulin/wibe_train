import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BetEventsModule } from './bet-events/bet-events.module';
import { BetsModule } from './bets/bets.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ExternalBankingModule } from './external-banking/external-banking.module';
import { PaymentModule } from './payments/payment.module';

@Module({
  imports: [
    // Подключаем ConfigModule для работы с переменными окружения
    ConfigModule.forRoot({
      isGlobal: true, // Делаем модуль глобальным
      envFilePath: '.env',
    }),

    // Настраиваем TypeORM для подключения к MySQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'betting_system'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // ВАЖНО: В продакшене использовать миграции!
        logging: false,
      }),
    }),

    // Подключаем все модули приложения
    AuthModule,
    UsersModule,
    BetEventsModule,
    BetsModule,
    TransactionsModule,
    ExternalBankingModule,
    PaymentModule,
  ],
})
export class AppModule {}
