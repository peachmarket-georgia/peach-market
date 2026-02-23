import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { AppLoggerService } from './core/logger/logger.service'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const logger = app.get(AppLoggerService)
  logger.setContext(bootstrap.name)

  // CORS 설정
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3003'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 속성 제거
      forbidNonWhitelisted: true, // DTO에 없는 속성이 있으면 에러
      transform: true, // 자동 타입 변환
    })
  )

  // Cookie parser
  app.use(cookieParser())

  // Global prefix
  app.setGlobalPrefix('api')

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Peach Market API')
    .setDescription('피치마켓 API 문서 - 미국 조지아주 한인 중고거래 플랫폼')
    .setVersion('1.0')
    .addTag('auth', '인증 관련 API (회원가입, 로그인, 토큰 관리)')
    .addTag('users', '사용자 관련 API (프로필, 중복 체크)')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
      description: 'Access Token (httpOnly 쿠키)',
    })
    .addCookieAuth('refresh_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refresh_token',
      description: 'Refresh Token (httpOnly 쿠키)',
    })
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  })

  await app.listen(3003)

  logger.log(`🍑 Peach Market API is running`)
  logger.log(`🚀 Server: http://localhost:3003`)
  logger.log(`📝 API Docs: http://localhost:3003/api/docs`)
}

void bootstrap()
