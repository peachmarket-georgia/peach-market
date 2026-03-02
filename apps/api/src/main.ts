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
      // Development: allow requests with no origin (server-side rendering, curl)
      if (!origin && process.env.NODE_ENV !== 'production') {
        callback(null, true)
        return
      }

      // Production: block requests with no origin (curl, postman, etc.)
      if (!origin) {
        logger.warn('CORS blocked: no origin header (direct API call)')
        callback(new Error('Origin header required'))
        return
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        logger.warn(`CORS blocked origin: ${origin}`)
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  const config = new DocumentBuilder()
    .setTitle('Peach Market API')
    .setDescription('피치마켓 API 문서 - 미국 조지아주 한인 중고거래 플랫폼')
    .setVersion('1.0')
    .addTag('auth', '인증 관련 API (회원가입, 로그인, 토큰 관리)')
    .addTag('users', '사용자 관련 API (프로필, 중복 체크)')
    .addTag('health', 'Health check API')
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

  const port = process.env.PORT || 3003
  await app.listen(port)

  logger.log(`Peach Market API is running`)
  logger.log(`Server: http://localhost:${port}`)
  logger.log(`API Docs: http://localhost:${port}/api/docs`)
}

void bootstrap()
