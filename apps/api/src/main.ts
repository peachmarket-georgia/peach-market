import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import basicAuth from 'express-basic-auth'
import { AppModule } from './app.module'
import { AppLoggerService } from './core/logger/logger.service'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

/**
 * Get CORS origins from environment variables
 */
function getCorsOrigins(): string[] {
  const origins: string[] = []

  // Development defaults
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000', 'http://localhost:3003')
  }

  // Frontend URL (required for production)
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL)
  }

  // Additional allowed origins (comma-separated)
  if (process.env.ALLOWED_ORIGINS) {
    const additional = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    origins.push(...additional)
  }

  return [...new Set(origins)]
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const logger = app.get(AppLoggerService)
  logger.setContext(bootstrap.name)

  // Dynamic CORS settings
  const allowedOrigins = getCorsOrigins()
  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`)

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) {
        callback(null, true)
        return
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        logger.warn(`CORS blocked origin: ${origin}`)
        // Return false instead of throwing error to avoid 500
        callback(null, false)
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  // Cookie parser
  app.use(cookieParser())

  // Global prefix
  app.setGlobalPrefix('api')

  // Swagger with Basic Auth protection
  const swaggerUser = process.env.SWAGGER_USER
  const swaggerPassword = process.env.SWAGGER_PASSWORD

  if (swaggerUser && swaggerPassword) {
    app.use(
      ['/api/docs', '/api/docs-json', '/api/docs-yaml'],
      basicAuth({
        users: { [swaggerUser]: swaggerPassword },
        challenge: true,
        realm: 'Peach Market API Docs',
      })
    )
    logger.log('Swagger protected with Basic Auth')
  } else {
    logger.warn('Swagger is NOT protected — set SWAGGER_USER & SWAGGER_PASSWORD to enable auth')
  }

  const isProduction = process.env.NODE_ENV === 'production'

  const config = new DocumentBuilder()
    .setTitle('Peach Market API')
    .setDescription(
      `## 피치마켓 API

미국 조지아주 한인을 위한 중고거래 플랫폼 API입니다.

### 인증 방식
- **Cookie 기반 JWT 인증**: 로그인 시 \`access_token\`과 \`refresh_token\`이 httpOnly 쿠키로 설정됩니다.
- **Access Token**: 15분 유효, API 요청 시 자동 전송
- **Refresh Token**: 7일 유효, 토큰 갱신 시 사용

### Rate Limiting
| 엔드포인트 | 제한 |
|-----------|------|
| 일반 API | 100회/분 |
| 로그인 | 5회/분 |
| 회원가입/비밀번호 찾기 | 3회/시간 |

### 에러 응답 형식
\`\`\`json
{
  "statusCode": 400,
  "message": "에러 메시지",
  "error": "Bad Request"
}
\`\`\`
`
    )
    .setVersion('1.0.0')
    .setContact('Peach Market Team', 'https://github.com/peachmarket-georgia', 'support@peachmarket.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer(
      isProduction ? 'https://peach-market-production.up.railway.app' : 'http://localhost:3003',
      isProduction ? 'Production' : 'Development'
    )
    .addTag('auth', '🔐 인증 - 회원가입, 로그인, 토큰 관리, OAuth')
    .addTag('users', '👤 사용자 - 프로필 조회/수정, 중복 체크')
    .addTag('products', '🛍️ 상품 - 상품 CRUD, 검색, 찜하기')
    .addTag('chat', '💬 채팅 - 채팅방 관리, 메시지')
    .addTag('reservations', '📅 예약 - 거래 예약, 확인, 취소')
    .addTag('upload', '📁 업로드 - 이미지 업로드')
    .addTag('health', '💚 헬스체크 - 서버 상태 확인')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
      description: 'Access Token (httpOnly 쿠키) - 15분 유효',
    })
    .addCookieAuth('refresh_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refresh_token',
      description: 'Refresh Token (httpOnly 쿠키) - 7일 유효',
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

  const port = process.env.PORT || 3003
  await app.listen(port)

  logger.log(`Peach Market API is running`)
  logger.log(`Server: http://localhost:${port}`)
  logger.log(`API Docs: http://localhost:${port}/api/docs`)
}

void bootstrap()
