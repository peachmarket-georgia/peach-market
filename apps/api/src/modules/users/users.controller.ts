import { Controller, Post, Body, Get, Patch, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiCookieAuth } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator'
import { CheckAvailabilityResponseDto } from './dto/check-availability-response.dto'
import { UserProfileResponseDto } from './dto/user-response.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('check-email')
  @ApiOperation({ summary: '이메일 중복 체크', description: '회원가입 시 이메일 사용 가능 여부 확인' })
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string', example: 'user@example.com' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '중복 체크 완료',
    type: CheckAvailabilityResponseDto,
  })
  async checkEmail(@Body('email') email: string) {
    const available = await this.usersService.checkEmailAvailability(email)
    return { available }
  }

  @Post('check-nickname')
  @ApiOperation({ summary: '닉네임 중복 체크', description: '회원가입 시 닉네임 사용 가능 여부 확인' })
  @ApiBody({
    schema: {
      properties: {
        nickname: { type: 'string', example: '피치유저' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '중복 체크 완료',
    type: CheckAvailabilityResponseDto,
  })
  async checkNickname(@Body('nickname') nickname: string) {
    const available = await this.usersService.checkNicknameAvailability(nickname)
    return { available }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 프로필 조회', description: '로그인한 사용자의 프로필 정보 조회 (비밀번호 제외)' })
  @ApiCookieAuth('access_token')
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  async getProfile(@CurrentUser() { userId }: JwtUser) {
    const user = await this.usersService.findById(userId)
    if (!user) {
      return null
    }
    // 비밀번호 제외하고 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...result } = user
    return result
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 프로필 수정', description: '로그인한 사용자의 프로필 정보 수정' })
  @ApiCookieAuth('access_token')
  @ApiResponse({
    status: 200,
    description: '프로필 수정 성공',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 409, description: '닉네임 중복' })
  async updateProfile(@CurrentUser() { userId }: JwtUser, @Body() updateDto: UpdateUserDto) {
    return this.usersService.updateProfile(userId, updateDto)
  }
}
