import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiQuery } from '@nestjs/swagger'
import { ReportType, ReportStatus } from '@prisma/client'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminRoleGuard } from './admin-role.guard'
import { AdminService } from './admin.service'
import { UpdateReportDto } from './dto/update-report.dto'

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
@ApiCookieAuth('access_token')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== 신고 관리 ====================

  @Get('reports')
  @ApiOperation({ summary: '신고 목록 조회', description: '모든 신고를 조회합니다 (관리자 전용)' })
  @ApiQuery({ name: 'type', enum: ReportType, required: false })
  @ApiQuery({ name: 'status', enum: ReportStatus, required: false })
  @ApiResponse({ status: 200, description: '신고 목록 반환' })
  @ApiResponse({ status: 403, description: '관리자 권한 필요' })
  findAllReports(@Query('type') type?: ReportType, @Query('status') status?: ReportStatus) {
    return this.adminService.findAllReports({ type, status })
  }

  @Get('reports/:id')
  @ApiOperation({ summary: '신고 상세 조회', description: '신고 상세 정보를 조회합니다 (관리자 전용)' })
  @ApiResponse({ status: 200, description: '신고 상세 반환' })
  @ApiResponse({ status: 404, description: '신고를 찾을 수 없음' })
  findReportById(@Param('id') id: string) {
    return this.adminService.findReportById(id)
  }

  @Patch('reports/:id')
  @ApiOperation({ summary: '신고 상태 변경', description: '신고 상태를 변경하고 관리자 메모를 작성합니다' })
  @ApiResponse({ status: 200, description: '신고 업데이트 성공' })
  @ApiResponse({ status: 404, description: '신고를 찾을 수 없음' })
  updateReport(@Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.adminService.updateReport(id, dto)
  }

  // ==================== 사용자 관리 ====================

  @Get('users')
  @ApiOperation({ summary: '사용자 목록 조회', description: '사용자 목록을 조회합니다 (관리자 전용)' })
  @ApiQuery({ name: 'search', required: false, description: '닉네임 또는 이메일 검색' })
  @ApiQuery({ name: 'blocked', required: false, description: '차단 상태 필터 (true/false)' })
  @ApiResponse({ status: 200, description: '사용자 목록 반환' })
  findAllUsers(@Query('search') search?: string, @Query('blocked') blocked?: string) {
    return this.adminService.findAllUsers({ search, blocked })
  }

  @Patch('users/:id/block')
  @ApiOperation({ summary: '사용자 차단', description: '사용자를 차단하고 모든 세션을 삭제합니다' })
  @ApiResponse({ status: 200, description: '차단 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  blockUser(@Param('id') id: string) {
    return this.adminService.blockUser(id)
  }

  @Patch('users/:id/unblock')
  @ApiOperation({ summary: '차단 해제', description: '사용자 차단을 해제합니다' })
  @ApiResponse({ status: 200, description: '차단 해제 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  unblockUser(@Param('id') id: string) {
    return this.adminService.unblockUser(id)
  }

  @Patch('users/:id/promote')
  @ApiOperation({ summary: '관리자 권한 부여', description: '사용자에게 관리자 권한을 부여합니다' })
  @ApiResponse({ status: 200, description: '관리자 권한 부여 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  promoteUser(@Param('id') id: string) {
    return this.adminService.promoteUser(id)
  }

  @Patch('users/:id/demote')
  @ApiOperation({ summary: '관리자 권한 해제', description: '관리자 권한을 해제합니다' })
  @ApiResponse({ status: 200, description: '관리자 권한 해제 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  demoteUser(@Param('id') id: string) {
    return this.adminService.demoteUser(id)
  }
}
