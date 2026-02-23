import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import cookieParser from 'cookie-parser'
import * as bcrypt from 'bcrypt'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/core/database/prisma.service'
import { ResendService } from '../src/modules/auth/resend.service'
import { SignupResponseDto } from '../src/modules/auth/dto/signup-response.dto'
import { LoginResponseDto } from '../src/modules/auth/dto/login-response.dto'
import { MessageResponseDto } from '../src/modules/auth/dto/message-response.dto'
import { CheckAvailabilityResponseDto } from '../src/modules/users/dto/check-availability-response.dto'
import { UserProfileResponseDto } from '../src/modules/users/dto/user-response.dto'
import { ErrorResponse } from './test-response.types'

describe('Auth (e2e)', () => {
  let app: INestApplication<App>
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ResendService)
      .useValue({
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      })
      .compile()

    app = moduleFixture.createNestApplication()
    prisma = app.get<PrismaService>(PrismaService)

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    )
    app.use(cookieParser())
    app.setGlobalPrefix('api')

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await prisma.favorite.deleteMany()
    await prisma.chatRoom.deleteMany()
    await prisma.review.deleteMany()
    await prisma.product.deleteMany()
    await prisma.emailVerification.deleteMany()
    await prisma.passwordReset.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('POST /api/auth/signup', () => {
    it('회원가입 성공', () => {
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          nickname: 'testuser',
          location: 'Georgia',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as SignupResponseDto
          expect(body.message).toContain('회원가입이 완료되었습니다')
          expect(body.email).toBe('test@example.com')
        })
    })

    it('이메일 중복 시 409 에러', async () => {
      await prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          password: 'hashedpassword',
          nickname: 'user1',
          location: 'Georgia',
        },
      })

      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          nickname: 'user2',
          location: 'Georgia',
        })
        .expect(409)
        .expect((res) => {
          const body = res.body as ErrorResponse
          expect(body.message).toContain('이미 사용 중인 이메일입니다')
        })
    })

    it('닉네임 중복 시 409 에러', async () => {
      await prisma.user.create({
        data: {
          email: 'user1@example.com',
          password: 'hashedpassword',
          nickname: 'duplicatenickname',
          location: 'Georgia',
        },
      })

      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'user2@example.com',
          password: 'password123',
          nickname: 'duplicatenickname',
          location: 'Georgia',
        })
        .expect(409)
        .expect((res) => {
          const body = res.body as ErrorResponse
          expect(body.message).toContain('이미 사용 중인 닉네임입니다')
        })
    })

    it('유효하지 않은 이메일 형식 시 400 에러', () => {
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'password123',
          nickname: 'testuser',
          location: 'Georgia',
        })
        .expect(400)
    })

    it('비밀번호가 8자 미만일 시 400 에러', () => {
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'short',
          nickname: 'testuser',
          location: 'Georgia',
        })
        .expect(400)
    })
  })

  describe('GET /api/auth/verify-email/:token', () => {
    it('이메일 인증 성공', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'verify@example.com',
          password: 'hashedpassword',
          nickname: 'verifyuser',
          location: 'Georgia',
          isEmailVerified: false,
        },
      })

      const verification = await prisma.emailVerification.create({
        data: {
          userId: user.id,
          token: 'valid-token-123',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      return request(app.getHttpServer())
        .get(`/api/auth/verify-email/${verification.token}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as MessageResponseDto
          expect(body.message).toContain('이메일 인증이 완료되었습니다')
        })
    })

    it('유효하지 않은 토큰 시 400 에러', () => {
      return request(app.getHttpServer())
        .get('/api/auth/verify-email/invalid-token')
        .expect(400)
        .expect((res) => {
          const body = res.body as ErrorResponse
          expect(body.message).toContain('유효하지 않은 인증 링크입니다')
        })
    })

    it('만료된 토큰 시 400 에러', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'expired@example.com',
          password: 'hashedpassword',
          nickname: 'expireduser',
          location: 'Georgia',
          isEmailVerified: false,
        },
      })

      const verification = await prisma.emailVerification.create({
        data: {
          userId: user.id,
          token: 'expired-token-123',
          expiresAt: new Date(Date.now() - 1000),
        },
      })

      return request(app.getHttpServer())
        .get(`/api/auth/verify-email/${verification.token}`)
        .expect(400)
        .expect((res) => {
          const body = res.body as ErrorResponse
          expect(body.message).toContain('인증 링크가 만료되었습니다')
        })
    })
  })

  describe('POST /api/auth/resend-verification', () => {
    it('이메일 인증 재발송 성공', async () => {
      await prisma.user.create({
        data: {
          email: 'resend@example.com',
          password: 'hashedpassword',
          nickname: 'resenduser',
          location: 'Georgia',
          isEmailVerified: false,
        },
      })

      return request(app.getHttpServer())
        .post('/api/auth/resend-verification')
        .send({
          email: 'resend@example.com',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as MessageResponseDto
          expect(body.message).toContain('인증 이메일이 발송되었습니다')
        })
    })

    it('이미 인증된 계정 시 400 에러', async () => {
      await prisma.user.create({
        data: {
          email: 'verified@example.com',
          password: 'hashedpassword',
          nickname: 'verifieduser',
          location: 'Georgia',
          isEmailVerified: true,
        },
      })

      return request(app.getHttpServer())
        .post('/api/auth/resend-verification')
        .send({
          email: 'verified@example.com',
        })
        .expect(400)
        .expect((res) => {
          const body = res.body as ErrorResponse
          expect(body.message).toContain('이미 인증된 계정입니다')
        })
    })

    it('존재하지 않는 이메일도 200 반환 (보안)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/resend-verification')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as MessageResponseDto
          expect(body.message).toContain('인증 이메일이 발송되었습니다')
        })
    })

    it('기존 토큰 삭제 후 새 토큰 발급', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'tokentest@example.com',
          password: 'hashedpassword',
          nickname: 'tokentestuser',
          location: 'Georgia',
          isEmailVerified: false,
        },
      })

      await prisma.emailVerification.create({
        data: {
          userId: user.id,
          token: 'old-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      await request(app.getHttpServer())
        .post('/api/auth/resend-verification')
        .send({
          email: 'tokentest@example.com',
        })
        .expect(200)

      const oldToken = await prisma.emailVerification.findUnique({
        where: { token: 'old-token' },
      })
      expect(oldToken).toBeNull()

      const newTokens = await prisma.emailVerification.findMany({
        where: { userId: user.id },
      })
      expect(newTokens).toHaveLength(1)
      expect(newTokens[0].token).not.toBe('old-token')
    })
  })

  describe('POST /api/auth/login', () => {
    it('로그인 성공', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10)

      await prisma.user.create({
        data: {
          email: 'login@example.com',
          password: hashedPassword,
          nickname: 'loginuser',
          location: 'Georgia',
          isEmailVerified: true,
        },
      })

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as LoginResponseDto
          expect(body.user).toBeDefined()
          expect(body.user.email).toBe('login@example.com')
          expect('password' in body.user).toBe(false)
          expect(res.headers['set-cookie']).toBeDefined()
          const cookies = res.headers['set-cookie'] as unknown as string[]
          expect(cookies.some((c) => c.includes('access_token'))).toBe(true)
          expect(cookies.some((c) => c.includes('refresh_token'))).toBe(true)
        })
    })

    it('이메일 미인증 시 401 에러', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10)

      await prisma.user.create({
        data: {
          email: 'unverified@example.com',
          password: hashedPassword,
          nickname: 'unverifieduser',
          location: 'Georgia',
          isEmailVerified: false,
        },
      })

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'unverified@example.com',
          password: 'password123',
        })
        .expect(401)
        .expect((res) => {
          const body = res.body as ErrorResponse
          expect(body.message).toContain('이메일 인증이 필요합니다')
        })
    })

    it('잘못된 비밀번호 시 401 에러', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10)

      await prisma.user.create({
        data: {
          email: 'wrongpass@example.com',
          password: hashedPassword,
          nickname: 'wrongpassuser',
          location: 'Georgia',
          isEmailVerified: true,
        },
      })

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          const body = res.body as ErrorResponse
          expect(body.message).toContain('이메일 또는 비밀번호가 올바르지 않습니다')
        })
    })

    it('존재하지 않는 사용자 시 401 에러', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401)
        .expect((res) => {
          const body = res.body as ErrorResponse
          expect(body.message).toContain('이메일 또는 비밀번호가 올바르지 않습니다')
        })
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('토큰 갱신 성공', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10)

      await prisma.user.create({
        data: {
          email: 'refresh@example.com',
          password: hashedPassword,
          nickname: 'refreshuser',
          location: 'Georgia',
          isEmailVerified: true,
        },
      })

      const loginRes = await request(app.getHttpServer()).post('/api/auth/login').send({
        email: 'refresh@example.com',
        password: 'password123',
      })

      const cookies = loginRes.headers['set-cookie']

      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', cookies)
        .expect(201)
        .expect((res) => {
          const body = res.body as MessageResponseDto
          expect(body.message).toContain('토큰이 갱신되었습니다')
          expect(res.headers['set-cookie']).toBeDefined()
        })
    })

    it('유효하지 않은 refresh token 시 401 에러', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=invalid-token'])
        .expect(401)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('로그아웃 성공', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10)

      await prisma.user.create({
        data: {
          email: 'logout@example.com',
          password: hashedPassword,
          nickname: 'logoutuser',
          location: 'Georgia',
          isEmailVerified: true,
        },
      })

      const loginRes = await request(app.getHttpServer()).post('/api/auth/login').send({
        email: 'logout@example.com',
        password: 'password123',
      })

      const cookies = loginRes.headers['set-cookie']

      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', cookies)
        .expect(201)
        .expect((res) => {
          const body = res.body as MessageResponseDto
          expect(body.message).toContain('로그아웃되었습니다')
        })
    })
  })

  describe('POST /api/auth/forgot-password', () => {
    it('비밀번호 재설정 이메일 발송 성공', async () => {
      await prisma.user.create({
        data: {
          email: 'forgot@example.com',
          password: 'hashedpassword',
          nickname: 'forgotuser',
          location: 'Georgia',
          isEmailVerified: true,
        },
      })

      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'forgot@example.com',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as MessageResponseDto
          expect(body.message).toContain('비밀번호 재설정 이메일이 발송되었습니다')
        })
    })

    it('존재하지 않는 이메일도 200 반환 (보안)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as MessageResponseDto
          expect(body.message).toContain('비밀번호 재설정 이메일이 발송되었습니다')
        })
    })
  })

  describe('POST /api/auth/reset-password/:token', () => {
    it('비밀번호 재설정 성공', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'reset@example.com',
          password: 'oldhashedpassword',
          nickname: 'resetuser',
          location: 'Georgia',
          isEmailVerified: true,
        },
      })

      const resetToken = await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: 'valid-reset-token-123',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      })

      return request(app.getHttpServer())
        .post(`/api/auth/reset-password/${resetToken.token}`)
        .send({
          newPassword: 'newpassword123',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as MessageResponseDto
          expect(body.message).toContain('비밀번호가 성공적으로 변경되었습니다')
        })
    })

    it('유효하지 않은 토큰 시 400 에러', () => {
      return request(app.getHttpServer())
        .post('/api/auth/reset-password/invalid-token')
        .send({
          newPassword: 'newpassword123',
        })
        .expect(400)
        .expect((res) => {
          const body = res.body as ErrorResponse
          expect(body.message).toContain('유효하지 않은 재설정 링크입니다')
        })
    })

    it('만료된 토큰 시 400 에러', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'expired-reset@example.com',
          password: 'oldhashedpassword',
          nickname: 'expiredresetuser',
          location: 'Georgia',
          isEmailVerified: true,
        },
      })

      const resetToken = await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: 'expired-reset-token-123',
          expiresAt: new Date(Date.now() - 1000),
        },
      })

      return request(app.getHttpServer())
        .post(`/api/auth/reset-password/${resetToken.token}`)
        .send({
          newPassword: 'newpassword123',
        })
        .expect(400)
        .expect((res) => {
          const body = res.body as ErrorResponse
          expect(body.message).toContain('재설정 링크가 만료되었습니다')
        })
    })
  })

  describe('POST /api/users/check-email', () => {
    it('이메일 사용 가능', () => {
      return request(app.getHttpServer())
        .post('/api/users/check-email')
        .send({
          email: 'available@example.com',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as CheckAvailabilityResponseDto
          expect(body.available).toBe(true)
        })
    })

    it('이메일 중복', async () => {
      await prisma.user.create({
        data: {
          email: 'taken@example.com',
          password: 'hashedpassword',
          nickname: 'takenuser',
          location: 'Georgia',
        },
      })

      return request(app.getHttpServer())
        .post('/api/users/check-email')
        .send({
          email: 'taken@example.com',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as CheckAvailabilityResponseDto
          expect(body.available).toBe(false)
        })
    })
  })

  describe('POST /api/users/check-nickname', () => {
    it('닉네임 사용 가능', () => {
      return request(app.getHttpServer())
        .post('/api/users/check-nickname')
        .send({
          nickname: 'availablenick',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as CheckAvailabilityResponseDto
          expect(body.available).toBe(true)
        })
    })

    it('닉네임 중복', async () => {
      await prisma.user.create({
        data: {
          email: 'user@example.com',
          password: 'hashedpassword',
          nickname: 'takennick',
          location: 'Georgia',
        },
      })

      return request(app.getHttpServer())
        .post('/api/users/check-nickname')
        .send({
          nickname: 'takennick',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as CheckAvailabilityResponseDto
          expect(body.available).toBe(false)
        })
    })
  })

  describe('GET /api/users/me', () => {
    it('프로필 조회 성공 (인증된 사용자)', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10)

      await prisma.user.create({
        data: {
          email: 'profile@example.com',
          password: hashedPassword,
          nickname: 'profileuser',
          location: 'Georgia',
          isEmailVerified: true,
        },
      })

      const loginRes = await request(app.getHttpServer()).post('/api/auth/login').send({
        email: 'profile@example.com',
        password: 'password123',
      })

      const cookies = loginRes.headers['set-cookie']

      return request(app.getHttpServer())
        .get('/api/users/me')
        .set('Cookie', cookies)
        .expect(200)
        .expect((res) => {
          const body = res.body as UserProfileResponseDto
          expect(body.email).toBe('profile@example.com')
          expect(body.nickname).toBe('profileuser')
          expect('password' in body).toBe(false)
        })
    })

    it('인증 없이 접근 시 401 에러', () => {
      return request(app.getHttpServer()).get('/api/users/me').expect(401)
    })
  })
})
