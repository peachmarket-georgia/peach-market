import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator'
import { ReportsService } from './reports.service'
import { CreateReportDto } from './dto/create-report.dto'

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('access_token')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '신고 접수', description: '사기/부적절 행위 신고 또는 버그 리포트를 접수합니다' })
  @ApiResponse({ status: 201, description: '신고 접수 성공' })
  @ApiResponse({ status: 400, description: '유효하지 않은 입력' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  create(@Body() dto: CreateReportDto, @CurrentUser() { userId }: JwtUser) {
    return this.reportsService.create(dto, userId)
  }

  @Get('my')
  @ApiOperation({ summary: '내 신고 목록', description: '본인이 접수한 신고 목록을 조회합니다' })
  @ApiResponse({ status: 200, description: '신고 목록 반환' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  findMyReports(@CurrentUser() { userId }: JwtUser) {
    return this.reportsService.findMyReports(userId)
  }
}
