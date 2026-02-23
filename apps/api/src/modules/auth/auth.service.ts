import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { PrismaService } from '../../core/database/prisma.service'
import { AppConfigService } from '../../core/config/config.service'
import { UsersService } from '../users/users.service'
import { ResendService } from './resend.service'
import { SignupDto } from './signup.dto'
import { LoginDto } from './login.dto'
import { ForgotPasswordDto, ResetPasswordDto } from './reset-password.dto'
import { ResendVerificationDto } from './dto/resend-verification.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private resendService: ResendService,
    private configService: AppConfigService
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, nickname, location } = signupDto

    const existingEmail = await this.usersService.findByEmail(email)
    if (existingEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다')
    }

    const existingNickname = await this.usersService.findByNickname(nickname)
    if (existingNickname) {
      throw new ConflictException('이미 사용 중인 닉네임입니다')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
        location,
        isEmailVerified: false,
      },
    })

    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    })

    await this.resendService.sendVerificationEmail(email, verificationToken)

    return {
      message: '회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.',
      email: user.email,
    }
  }

  async verifyEmail(token: string) {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!verification) {
      throw new BadRequestException('유효하지 않은 인증 링크입니다')
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('인증 링크가 만료되었습니다')
    }

    await this.prisma.user.update({
      where: { id: verification.userId },
      data: { isEmailVerified: true },
    })

    await this.prisma.emailVerification.delete({
      where: { id: verification.id },
    })

    return { message: '이메일 인증이 완료되었습니다' }
  }

  async resendVerificationEmail(resendVerificationDto: ResendVerificationDto) {
    const { email } = resendVerificationDto

    const user = await this.usersService.findByEmail(email)

    if (!user) {
      return { message: '인증 이메일이 발송되었습니다' }
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('이미 인증된 계정입니다')
    }

    await this.prisma.emailVerification.deleteMany({
      where: { userId: user.id },
    })

    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    })

    await this.resendService.sendVerificationEmail(email, verificationToken)

    return { message: '인증 이메일이 발송되었습니다' }
  }

  async login(loginDto: LoginDto, deviceInfo?: string) {
    const { email, password } = loginDto

    const user = await this.usersService.findByEmail(email)
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다')
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('이메일 인증이 필요합니다. 메일함을 확인해주세요.')
    }

    if (!user.password) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다')
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다')
    }

    const tokens = this.generateTokens(user.id, user.email)

    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10)
    const refreshExpiresAt = new Date()
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7)

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: hashedRefreshToken,
        deviceInfo: deviceInfo || 'Unknown',
        expiresAt: refreshExpiresAt,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  }

  async refresh(userId: string, refreshToken: string, deviceInfo?: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    })

    let validSession: (typeof sessions)[0] | null = null
    for (const session of sessions) {
      const isValid = await bcrypt.compare(refreshToken, session.refreshToken)
      if (isValid) {
        validSession = session
        break
      }
    }

    if (!validSession) {
      await this.prisma.session.deleteMany({ where: { userId } })
      throw new UnauthorizedException('유효하지 않은 토큰입니다. 다시 로그인해주세요.')
    }

    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다')
    }
    const tokens = this.generateTokens(user.id, user.email)

    await this.prisma.session.delete({ where: { id: validSession.id } })

    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10)
    const refreshExpiresAt = new Date()
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7)

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: hashedRefreshToken,
        deviceInfo: deviceInfo || 'Unknown',
        expiresAt: refreshExpiresAt,
      },
    })

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  }

  async logout(userId: string, refreshToken: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
    })

    for (const session of sessions) {
      const isMatch = await bcrypt.compare(refreshToken, session.refreshToken)
      if (isMatch) {
        await this.prisma.session.delete({ where: { id: session.id } })
        break
      }
    }

    return { message: '로그아웃되었습니다' }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto

    const user = await this.usersService.findByEmail(email)
    if (!user) {
      return { message: '비밀번호 재설정 이메일이 발송되었습니다' }
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    })

    await this.resendService.sendPasswordResetEmail(email, resetToken)

    return { message: '비밀번호 재설정 이메일이 발송되었습니다' }
  }

  async resetPassword(token: string, resetPasswordDto: ResetPasswordDto) {
    const { newPassword } = resetPasswordDto

    const passwordReset = await this.prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!passwordReset) {
      throw new BadRequestException('유효하지 않은 재설정 링크입니다')
    }

    if (passwordReset.expiresAt < new Date()) {
      throw new BadRequestException('재설정 링크가 만료되었습니다')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await this.prisma.user.update({
      where: { id: passwordReset.userId },
      data: { password: hashedPassword },
    })

    await this.prisma.passwordReset.delete({
      where: { id: passwordReset.id },
    })

    return { message: '비밀번호가 성공적으로 변경되었습니다' }
  }

  async googleLogin(googleUser: { googleId: string; email: string; name: string; avatarUrl?: string }) {
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    })

    if (user) {
      const account = await this.prisma.account.findFirst({
        where: { userId: user.id, provider: 'google' },
      })

      if (!account) {
        await this.prisma.account.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerAccountId: googleUser.googleId,
          },
        })
      }
    } else {
      let nickname = googleUser.name
      let nicknameExists = await this.usersService.findByNickname(nickname)
      let counter = 1

      while (nicknameExists) {
        nickname = `${googleUser.name}${counter}`
        nicknameExists = await this.usersService.findByNickname(nickname)
        counter++
      }

      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          nickname,
          avatarUrl: googleUser.avatarUrl,
          location: 'Georgia',
          isEmailVerified: true,
        },
      })

      await this.prisma.account.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerAccountId: googleUser.googleId,
        },
      })
    }

    const tokens = this.generateTokens(user.id, user.email)

    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10)
    const refreshExpiresAt = new Date()
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7)

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: hashedRefreshToken,
        deviceInfo: 'Google OAuth',
        expiresAt: refreshExpiresAt,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email }

    const accessToken = this.jwtService.sign(payload)

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.jwtSecret,
      expiresIn: '7d',
    })

    return { accessToken, refreshToken }
  }
}
