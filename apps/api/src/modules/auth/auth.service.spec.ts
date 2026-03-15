import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConflictException, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { AuthService } from './auth.service'
import { PrismaService } from '../../core/database/prisma.service'
import { AppConfigService } from '../../core/config/config.service'
import { UsersService } from '../users/users.service'
import { ResendService } from './resend.service'

describe('AuthService', () => {
  let service: AuthService
  let prisma: Record<string, any>
  let usersService: Record<string, any>
  let jwtService: Record<string, any>
  let resendService: Record<string, any>

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    nickname: '테스터',
    location: 'Atlanta, GA',
    isEmailVerified: true,
    isBlocked: false,
    role: 'USER',
    mannerScore: 4.5,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      user: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      emailVerification: {
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
      },
      passwordReset: {
        create: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      session: {
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
      account: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
    }

    usersService = {
      findByEmail: jest.fn(),
      findByNickname: jest.fn(),
      findById: jest.fn(),
    }

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
    }

    resendService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ResendService, useValue: resendService },
        { provide: AppConfigService, useValue: { jwtSecret: 'test-secret' } },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  describe('signup', () => {
    const signupDto = {
      email: 'new@example.com',
      password: 'password123!',
      nickname: '새유저',
      location: 'Duluth, GA',
    }

    it('정상적으로 회원가입되어야 한다', async () => {
      usersService.findByEmail.mockResolvedValue(null)
      usersService.findByNickname.mockResolvedValue(null)
      prisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) =>
        cb({
          user: { create: jest.fn().mockResolvedValue({ id: 'new-user', email: signupDto.email }) },
          emailVerification: { create: jest.fn() },
        })
      )
      resendService.sendVerificationEmail.mockResolvedValue(undefined)

      const result = await service.signup(signupDto)

      expect(result.email).toBe(signupDto.email)
      expect(result.message).toContain('회원가입')
      expect(usersService.findByEmail).toHaveBeenCalledWith(signupDto.email)
      expect(usersService.findByNickname).toHaveBeenCalledWith(signupDto.nickname)
    })

    it('중복 이메일이면 ConflictException을 던져야 한다', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser)

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException)
    })

    it('중복 닉네임이면 ConflictException을 던져야 한다', async () => {
      usersService.findByEmail.mockResolvedValue(null)
      usersService.findByNickname.mockResolvedValue(mockUser)

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException)
    })

    it('이메일 발송 실패 시 유저를 삭제하고 에러를 던져야 한다', async () => {
      usersService.findByEmail.mockResolvedValue(null)
      usersService.findByNickname.mockResolvedValue(null)
      prisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) =>
        cb({
          user: { create: jest.fn().mockResolvedValue({ id: 'new-user', email: signupDto.email }) },
          emailVerification: { create: jest.fn() },
        })
      )
      resendService.sendVerificationEmail.mockRejectedValue(new Error('Email failed'))

      await expect(service.signup(signupDto)).rejects.toThrow(BadRequestException)
      expect(prisma.emailVerification.deleteMany).toHaveBeenCalled()
      expect(prisma.user.delete).toHaveBeenCalled()
    })
  })

  describe('verifyEmail', () => {
    it('유효한 토큰이면 이메일 인증이 완료되어야 한다', async () => {
      const verification = {
        id: 'v-1',
        userId: 'user-1',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      }
      prisma.emailVerification.findUnique.mockResolvedValue(verification)
      prisma.user.update.mockResolvedValue({ ...mockUser, isEmailVerified: true })
      prisma.emailVerification.delete.mockResolvedValue(undefined)

      const result = await service.verifyEmail('valid-token')

      expect(result.message).toContain('인증')
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isEmailVerified: true },
      })
    })

    it('유효하지 않은 토큰이면 BadRequestException을 던져야 한다', async () => {
      prisma.emailVerification.findUnique.mockResolvedValue(null)

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException)
    })

    it('만료된 토큰이면 BadRequestException을 던져야 한다', async () => {
      prisma.emailVerification.findUnique.mockResolvedValue({
        id: 'v-1',
        userId: 'user-1',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 86400000),
        user: mockUser,
      })

      await expect(service.verifyEmail('expired-token')).rejects.toThrow(BadRequestException)
    })
  })

  describe('resendVerificationEmail', () => {
    it('존재하지 않는 이메일이면 성공 메시지를 반환해야 한다 (보안)', async () => {
      usersService.findByEmail.mockResolvedValue(null)

      const result = await service.resendVerificationEmail({ email: 'unknown@example.com' })

      expect(result.message).toContain('발송')
    })

    it('이미 인증된 계정이면 BadRequestException을 던져야 한다', async () => {
      usersService.findByEmail.mockResolvedValue({ ...mockUser, isEmailVerified: true })

      await expect(service.resendVerificationEmail({ email: mockUser.email })).rejects.toThrow(BadRequestException)
    })

    it('미인증 유저에게 인증 이메일을 재발송해야 한다', async () => {
      usersService.findByEmail.mockResolvedValue({ ...mockUser, isEmailVerified: false })
      prisma.emailVerification.deleteMany.mockResolvedValue(undefined)
      prisma.emailVerification.create.mockResolvedValue(undefined)
      resendService.sendVerificationEmail.mockResolvedValue(undefined)

      const result = await service.resendVerificationEmail({ email: mockUser.email })

      expect(result.message).toContain('발송')
      expect(prisma.emailVerification.deleteMany).toHaveBeenCalled()
      expect(resendService.sendVerificationEmail).toHaveBeenCalled()
    })
  })

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123!' }

    it('정상적으로 로그인되어야 한다', async () => {
      const hashedPassword = await bcrypt.hash('password123!', 10)
      usersService.findByEmail.mockResolvedValue({ ...mockUser, password: hashedPassword })
      prisma.$transaction.mockResolvedValue([{}, {}])

      const result = await service.login(loginDto)

      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.user.email).toBe(loginDto.email)
      expect(result.user).not.toHaveProperty('password')
    })

    it('존재하지 않는 이메일이면 UnauthorizedException을 던져야 한다', async () => {
      usersService.findByEmail.mockResolvedValue(null)

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('이메일 미인증 유저면 UnauthorizedException을 던져야 한다', async () => {
      usersService.findByEmail.mockResolvedValue({ ...mockUser, isEmailVerified: false })

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('차단된 유저면 ForbiddenException을 던져야 한다', async () => {
      usersService.findByEmail.mockResolvedValue({ ...mockUser, isBlocked: true })

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException)
    })

    it('잘못된 비밀번호면 UnauthorizedException을 던져야 한다', async () => {
      const hashedPassword = await bcrypt.hash('different-password', 10)
      usersService.findByEmail.mockResolvedValue({ ...mockUser, password: hashedPassword })

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('password가 null인 유저(OAuth만 가입)면 UnauthorizedException을 던져야 한다', async () => {
      usersService.findByEmail.mockResolvedValue({ ...mockUser, password: null })

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('refresh', () => {
    it('유효한 리프레시 토큰이면 새 토큰을 발급해야 한다', async () => {
      const rawToken = 'raw-refresh-token'
      const hashedToken = await bcrypt.hash(rawToken, 10)
      prisma.session.findMany.mockResolvedValue([
        { id: 'session-1', userId: 'user-1', refreshToken: hashedToken, expiresAt: new Date(Date.now() + 86400000) },
      ])
      usersService.findById.mockResolvedValue(mockUser)
      prisma.session.delete.mockResolvedValue(undefined)
      prisma.session.create.mockResolvedValue(undefined)

      const result = await service.refresh('user-1', rawToken)

      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(prisma.session.delete).toHaveBeenCalledWith({ where: { id: 'session-1' } })
    })

    it('유효하지 않은 리프레시 토큰이면 모든 세션을 삭제하고 에러를 던져야 한다', async () => {
      prisma.session.findMany.mockResolvedValue([
        {
          id: 'session-1',
          userId: 'user-1',
          refreshToken: 'different-hash',
          expiresAt: new Date(Date.now() + 86400000),
        },
      ])

      await expect(service.refresh('user-1', 'invalid-token')).rejects.toThrow(UnauthorizedException)
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
    })

    it('차단된 유저면 세션을 삭제하고 ForbiddenException을 던져야 한다', async () => {
      const rawToken = 'raw-refresh-token'
      const hashedToken = await bcrypt.hash(rawToken, 10)
      prisma.session.findMany.mockResolvedValue([
        { id: 'session-1', userId: 'user-1', refreshToken: hashedToken, expiresAt: new Date(Date.now() + 86400000) },
      ])
      usersService.findById.mockResolvedValue({ ...mockUser, isBlocked: true })

      await expect(service.refresh('user-1', rawToken)).rejects.toThrow(ForbiddenException)
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
    })
  })

  describe('logout', () => {
    it('매칭되는 세션을 삭제해야 한다', async () => {
      const rawToken = 'raw-refresh-token'
      const hashedToken = await bcrypt.hash(rawToken, 10)
      prisma.session.findMany.mockResolvedValue([{ id: 'session-1', userId: 'user-1', refreshToken: hashedToken }])
      prisma.session.delete.mockResolvedValue(undefined)

      const result = await service.logout('user-1', rawToken)

      expect(result.message).toContain('로그아웃')
      expect(prisma.session.delete).toHaveBeenCalledWith({ where: { id: 'session-1' } })
    })

    it('매칭되는 세션이 없어도 성공 메시지를 반환해야 한다', async () => {
      prisma.session.findMany.mockResolvedValue([])

      const result = await service.logout('user-1', 'some-token')

      expect(result.message).toContain('로그아웃')
    })
  })

  describe('forgotPassword', () => {
    it('존재하는 유저에게 비밀번호 재설정 이메일을 보내야 한다', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser)
      prisma.passwordReset.create.mockResolvedValue(undefined)
      resendService.sendPasswordResetEmail.mockResolvedValue(undefined)

      const result = await service.forgotPassword({ email: mockUser.email })

      expect(result.message).toContain('발송')
      expect(resendService.sendPasswordResetEmail).toHaveBeenCalled()
    })

    it('존재하지 않는 이메일이어도 동일한 메시지를 반환해야 한다 (보안)', async () => {
      usersService.findByEmail.mockResolvedValue(null)

      const result = await service.forgotPassword({ email: 'unknown@example.com' })

      expect(result.message).toContain('발송')
      expect(resendService.sendPasswordResetEmail).not.toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    it('유효한 토큰으로 비밀번호를 변경해야 한다', async () => {
      prisma.passwordReset.findUnique.mockResolvedValue({
        id: 'pr-1',
        userId: 'user-1',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000),
        user: mockUser,
      })
      prisma.user.update.mockResolvedValue(undefined)
      prisma.passwordReset.delete.mockResolvedValue(undefined)

      const result = await service.resetPassword('valid-token', { newPassword: 'newPass123!' })

      expect(result.message).toContain('변경')
      expect(prisma.user.update).toHaveBeenCalled()
    })

    it('유효하지 않은 토큰이면 BadRequestException을 던져야 한다', async () => {
      prisma.passwordReset.findUnique.mockResolvedValue(null)

      await expect(service.resetPassword('invalid', { newPassword: 'newPass123!' })).rejects.toThrow(
        BadRequestException
      )
    })

    it('만료된 토큰이면 BadRequestException을 던져야 한다', async () => {
      prisma.passwordReset.findUnique.mockResolvedValue({
        id: 'pr-1',
        userId: 'user-1',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 3600000),
        user: mockUser,
      })

      await expect(service.resetPassword('expired-token', { newPassword: 'newPass123!' })).rejects.toThrow(
        BadRequestException
      )
    })
  })

  describe('googleLogin', () => {
    const googleUser = {
      googleId: 'google-123',
      email: 'google@example.com',
      name: '구글유저',
      avatarUrl: 'https://example.com/avatar.jpg',
    }

    it('기존 유저에 Google 계정을 연결해야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)
      prisma.account.findFirst.mockResolvedValue(null)
      prisma.account.create.mockResolvedValue(undefined)
      prisma.session.create.mockResolvedValue(undefined)

      const result = await service.googleLogin(googleUser)

      expect(result.accessToken).toBeDefined()
      expect(result.user).not.toHaveProperty('password')
      expect(prisma.account.create).toHaveBeenCalled()
    })

    it('이미 Google 연결된 유저는 바로 로그인해야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)
      prisma.account.findFirst.mockResolvedValue({ id: 'acc-1', provider: 'google' })
      prisma.session.create.mockResolvedValue(undefined)

      const result = await service.googleLogin(googleUser)

      expect(result.accessToken).toBeDefined()
      expect(prisma.account.create).not.toHaveBeenCalled()
    })

    it('신규 유저를 생성하고 Google 계정을 연결해야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      usersService.findByNickname.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({ ...mockUser, email: googleUser.email })
      prisma.account.create.mockResolvedValue(undefined)
      prisma.session.create.mockResolvedValue(undefined)

      const result = await service.googleLogin(googleUser)

      expect(result.accessToken).toBeDefined()
      expect(prisma.user.create).toHaveBeenCalled()
    })

    it('차단된 유저면 ForbiddenException을 던져야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isBlocked: true })

      await expect(service.googleLogin(googleUser)).rejects.toThrow(ForbiddenException)
    })

    it('닉네임 중복 시 숫자를 붙여 생성해야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      usersService.findByNickname
        .mockResolvedValueOnce({ id: 'existing' }) // '구글유저' 중복
        .mockResolvedValueOnce(null) // '구글유저1' 사용 가능
      prisma.user.create.mockResolvedValue({ ...mockUser, nickname: '구글유저1' })
      prisma.account.create.mockResolvedValue(undefined)
      prisma.session.create.mockResolvedValue(undefined)

      await service.googleLogin(googleUser)

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ nickname: '구글유저1' }),
        })
      )
    })
  })
})
