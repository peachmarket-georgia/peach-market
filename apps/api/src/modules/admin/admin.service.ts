import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { ReportType, ReportStatus } from '@prisma/client'
import { PrismaService } from '../../core/database/prisma.service'
import { UpdateReportDto } from './dto/update-report.dto'

const REPORT_DETAIL_SELECT = {
  id: true,
  type: true,
  status: true,
  description: true,
  imageUrls: true,
  productId: true,
  adminNote: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  reporter: { select: { id: true, nickname: true, email: true, avatarUrl: true } },
  targetUser: { select: { id: true, nickname: true, email: true, avatarUrl: true, isBlocked: true } },
} as const

const USER_SELECT = {
  id: true,
  email: true,
  nickname: true,
  avatarUrl: true,
  location: true,
  role: true,
  isBlocked: true,
  createdAt: true,
} as const

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllReports(filters: { type?: ReportType; status?: ReportStatus }) {
    const where: Record<string, unknown> = {}
    if (filters.type) where.type = filters.type
    if (filters.status) where.status = filters.status

    return this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: REPORT_DETAIL_SELECT,
    })
  }

  async findReportById(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: REPORT_DETAIL_SELECT,
    })

    if (!report) {
      throw new NotFoundException('신고를 찾을 수 없습니다')
    }

    return report
  }

  async updateReport(id: string, dto: UpdateReportDto) {
    const report = await this.prisma.report.findUnique({ where: { id } })
    if (!report) {
      throw new NotFoundException('신고를 찾을 수 없습니다')
    }

    const data: Record<string, unknown> = {}
    if (dto.status) {
      data.status = dto.status
      if (dto.status === 'RESOLVED' || dto.status === 'DISMISSED') {
        data.resolvedAt = new Date()
      }
    }
    if (dto.adminNote !== undefined) {
      data.adminNote = dto.adminNote
    }

    return this.prisma.report.update({
      where: { id },
      data,
      select: REPORT_DETAIL_SELECT,
    })
  }

  async findAllUsers(filters: { search?: string; blocked?: string }) {
    const where: Record<string, unknown> = {}

    if (filters.search) {
      where.OR = [{ nickname: { contains: filters.search } }, { email: { contains: filters.search } }]
    }

    if (filters.blocked === 'true') {
      where.isBlocked = true
    } else if (filters.blocked === 'false') {
      where.isBlocked = false
    }

    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: USER_SELECT,
    })
  }

  async blockUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다')
    }

    if (user.isBlocked) {
      throw new BadRequestException('이미 차단된 사용자입니다')
    }

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { isBlocked: true } }),
      this.prisma.session.deleteMany({ where: { userId } }),
    ])

    return { message: '사용자가 차단되었습니다' }
  }

  async unblockUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다')
    }

    if (!user.isBlocked) {
      throw new BadRequestException('차단되지 않은 사용자입니다')
    }

    await this.prisma.user.update({ where: { id: userId }, data: { isBlocked: false } })

    return { message: '차단이 해제되었습니다' }
  }

  async promoteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다')
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('이미 관리자입니다')
    }

    await this.prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } })

    return { message: '관리자 권한이 부여되었습니다' }
  }

  async demoteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다')
    }

    if (user.role === 'USER') {
      throw new BadRequestException('이미 일반 사용자입니다')
    }

    await this.prisma.user.update({ where: { id: userId }, data: { role: 'USER' } })

    return { message: '관리자 권한이 해제되었습니다' }
  }
}
