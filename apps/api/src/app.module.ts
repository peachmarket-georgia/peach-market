import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './core/config/config.module';
import { AppLoggerModule } from './core/logger/logger.module';
import { PrismaModule } from './core/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ChatModule } from './chat/chat.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    // Core modules (글로벌 인프라)
    AppConfigModule,
    AppLoggerModule,
    PrismaModule,

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1분
        limit: 100, // 1분당 100회
      },
    ]),

    // Feature modules (비즈니스 도메인)
    AuthModule,
    UsersModule,
    ChatModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ...(process.env.NODE_ENV === 'test'
      ? []
      : [
          {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
          },
        ]),
  ],
})
export class AppModule {}
