import { Controller, Post, Body, Get, Param, Res, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiCookieAuth } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { Throttle } from '@nestjs/throttler'
import type { Response, Request } from 'express'
import { AuthService } from './auth.service'
import { SignupDto } from './signup.dto'
import { LoginDto } from './login.dto'
import { ForgotPasswordDto, ResetPasswordDto } from './reset-password.dto'
import { ResendVerificationDto } from './dto/resend-verification.dto'
import { SignupResponseDto } from './dto/signup-response.dto'
import { LoginResponseDto } from './dto/login-response.dto'
import { MessageResponseDto } from './dto/message-response.dto'
import { JwtRefreshAuthGuard } from './jwt-refresh-auth.guard'
import { AppConfigService } from '../../core/config/config.service'
import { Public } from '../../core/decorators/public.decorator'
import { CurrentUser, type JwtRefreshUser } from './current-user.decorator'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: AppConfigService
  ) {}

  private cookieOptions(maxAge: number) {
    const isProduction = this.configService.nodeEnv === 'production'
    const cookieDomain = this.configService.cookieDomain
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      maxAge,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    }
  }

  @Post('signup')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 1시간당 3회
  @ApiOperation({ summary: '회원가입', description: '이메일/비밀번호 기반 회원가입. 가입 후 이메일 인증 필요.' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({ status: 201, description: '회원가입 성공. 이메일 인증 링크 발송됨.', type: SignupResponseDto })
  @ApiResponse({ status: 409, description: '이메일 또는 닉네임 중복' })
  @ApiResponse({ status: 400, description: '입력값 검증 실패' })
  @ApiResponse({ status: 429, description: '요청 횟수 초과 (1시간당 3회 제한)' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto)
  }

  @Get('verify-email/:token')
  @Public()
  @ApiOperation({ summary: '이메일 인증', description: '이메일로 받은 인증 토큰을 통해 이메일 인증 처리' })
  @ApiParam({ name: 'token', description: '이메일 인증 토큰' })
  @ApiResponse({ status: 200, description: '이메일 인증 성공', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: '유효하지 않거나 만료된 토큰' })
  async verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token)
  }

  @Post('resend-verification')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 1시간당 3회
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '이메일 인증 재발송',
    description: '인증 이메일을 재발송합니다. 기존 인증 토큰은 삭제되고 새로운 토큰이 발송됩니다.',
  })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({ status: 200, description: '인증 이메일 발송 성공', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: '이미 인증된 계정' })
  @ApiResponse({ status: 429, description: '요청 횟수 초과 (1시간당 3회 제한)' })
  async resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    return await this.authService.resendVerificationEmail(resendVerificationDto)
  }

  @Post('login')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 1분당 5회
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인',
    description: '이메일/비밀번호로 로그인. Access Token과 Refresh Token을 httpOnly 쿠키로 반환.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: '로그인 성공. 쿠키에 access_token, refresh_token 설정됨.',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: '이메일 미인증 또는 잘못된 인증 정보' })
  @ApiResponse({ status: 429, description: '요청 횟수 초과 (1분당 5회 제한)' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const deviceInfo = req.headers['user-agent']
    const result = await this.authService.login(loginDto, deviceInfo)

    res.cookie('access_token', result.accessToken, this.cookieOptions(15 * 60 * 1000))
    res.cookie('refresh_token', result.refreshToken, this.cookieOptions(7 * 24 * 60 * 60 * 1000))

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessToken: _accessToken, refreshToken: _refreshToken, ...response } = result
    return response
  }

  @Post('refresh')
  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @ApiOperation({
    summary: '토큰 갱신',
    description: 'Refresh Token을 사용하여 Access Token과 Refresh Token을 모두 갱신.',
  })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({ status: 201, description: '토큰 갱신 성공. 새로운 토큰이 쿠키에 설정됨.', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: '유효하지 않은 Refresh Token 또는 재사용 감지' })
  async refresh(
    @CurrentUser() { userId, refreshToken }: JwtRefreshUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const deviceInfo = req.headers['user-agent']

    const result = await this.authService.refresh(userId, refreshToken, deviceInfo)

    res.cookie('access_token', result.accessToken, this.cookieOptions(15 * 60 * 1000))
    res.cookie('refresh_token', result.refreshToken, this.cookieOptions(7 * 24 * 60 * 60 * 1000))

    return { message: '토큰이 갱신되었습니다' }
  }

  @Post('logout')
  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @ApiOperation({ summary: '로그아웃', description: 'Refresh Token을 무효화하고 쿠키를 삭제.' })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({ status: 201, description: '로그아웃 성공. 쿠키가 삭제됨.', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: '유효하지 않은 Refresh Token' })
  async logout(@CurrentUser() { userId, refreshToken }: JwtRefreshUser, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(userId, refreshToken)

    const cookieDomain = this.configService.cookieDomain
    const clearOptions = cookieDomain ? { domain: cookieDomain } : {}

    res.clearCookie('access_token', clearOptions)
    res.clearCookie('refresh_token', clearOptions)

    return { message: '로그아웃되었습니다' }
  }

  @Post('forgot-password')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 1시간당 3회
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '비밀번호 재설정 요청', description: '비밀번호 재설정 이메일 발송' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: '비밀번호 재설정 이메일 발송 성공', type: MessageResponseDto })
  @ApiResponse({ status: 429, description: '요청 횟수 초과 (1시간당 3회 제한)' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto)
  }

  @Post('reset-password/:token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '비밀번호 재설정', description: '토큰을 사용하여 비밀번호 재설정' })
  @ApiParam({ name: 'token', description: '비밀번호 재설정 토큰' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: '비밀번호 재설정 성공', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: '유효하지 않거나 만료된 토큰' })
  async resetPassword(@Param('token') token: string, @Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(token, resetPasswordDto)
  }

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google 로그인', description: 'Google OAuth 로그인 시작' })
  @ApiResponse({ status: 302, description: 'Google 로그인 페이지로 리다이렉트' })
  async googleLogin() {
    // Guard가 리다이렉트 처리
  }

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google 로그인 콜백', description: 'Google OAuth 콜백 처리' })
  @ApiResponse({ status: 200, description: 'Google 로그인 성공. 쿠키 설정 및 프론트엔드로 리다이렉트.' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as { googleId: string; email: string; name: string; avatarUrl?: string }
    const result = await this.authService.googleLogin(googleUser)

    const frontendUrl = this.configService.frontendUrl
    const cookieDomain = this.configService.cookieDomain
    const isProduction = this.configService.nodeEnv === 'production'
    const googleCookieOptions = (maxAge: number) => ({
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    })

    res.cookie('access_token', result.accessToken, googleCookieOptions(15 * 60 * 1000))
    res.cookie('refresh_token', result.refreshToken, googleCookieOptions(7 * 24 * 60 * 60 * 1000))

    const redirectPath = result.user.isProfileComplete ? '/marketplace' : '/onboarding'
    res.redirect(`${frontendUrl}${redirectPath}`)
  }
}
