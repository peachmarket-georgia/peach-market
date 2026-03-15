import { Controller, Post, Delete, Get, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator'
import { UserBlocksService } from './user-blocks.service'

@ApiTags('user-blocks')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('access_token')
export class UserBlocksController {
  constructor(private readonly userBlocksService: UserBlocksService) {}

  @Post(':id/block')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '사용자 차단' })
  @ApiResponse({ status: 201, description: '차단 성공' })
  @ApiResponse({ status: 400, description: '자기 자신 차단 또는 이미 차단됨' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  blockUser(@Param('id') blockedId: string, @CurrentUser() { userId }: JwtUser) {
    return this.userBlocksService.blockUser(userId, blockedId)
  }

  @Delete(':id/block')
  @ApiOperation({ summary: '사용자 차단 해제' })
  @ApiResponse({ status: 200, description: '차단 해제 성공' })
  @ApiResponse({ status: 404, description: '차단 기록을 찾을 수 없음' })
  unblockUser(@Param('id') blockedId: string, @CurrentUser() { userId }: JwtUser) {
    return this.userBlocksService.unblockUser(userId, blockedId)
  }

  @Get('blocked')
  @ApiOperation({ summary: '차단한 사용자 목록' })
  @ApiResponse({ status: 200, description: '차단 목록 반환' })
  getBlockedUsers(@CurrentUser() { userId }: JwtUser) {
    return this.userBlocksService.getBlockedUsers(userId)
  }
}
