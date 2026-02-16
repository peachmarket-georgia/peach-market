import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })

  // 전역 유효성 검사 파이프
  // whitelist: DTO에 정의되지 않은 필드 자동 제거 (악의적 필드 주입 방지)
  // transform: 요청 데이터를 DTO 클래스 인스턴스로 자동 변환 (예: "100" → 100)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  )

  await app.listen(process.env.PORT ?? 4000)
}
bootstrap()
