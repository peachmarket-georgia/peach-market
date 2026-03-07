import { Module } from '@nestjs/common'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AppConfigModule } from './core/config/config.module'
import { AppLoggerModule } from './core/logger/logger.module'
import { PrismaModule } from './core/database/prisma.module'
import { HealthModule } from './core/health/health.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { ProductsModule } from './modules/products/products.module'
import { ReservationsModule } from './modules/reservations/reservations.module'
import { ChatModule } from './chat/chat.module'
import { UploadModule } from './modules/upload/upload.module'

@Module({
  imports: [
    // Core modules (글로벌 인프라)
    AppConfigModule,
    AppLoggerModule,
    PrismaModule,
    HealthModule,

    // Rate Limiting (개발환경에서는 더 높은 limit 적용)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1분
        limit: process.env.NODE_ENV === 'production' ? 100 : 1000, // 개발: 1000회, 프로덕션: 100회
      },
    ]),

    // Feature modules (비즈니스 도메인)
    AuthModule,
    UsersModule,
    ProductsModule,
    ReservationsModule,
    ChatModule,
    UploadModule,
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
          {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
          },
        ]),
  ],
})
export class AppModule {}
