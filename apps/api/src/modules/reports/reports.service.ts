import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../core/database/prisma.service'
import { CreateReportDto } from './dto/create-report.dto'

const REPORT_SELECT = {
  id: true,
  type: true,
  status: true,
  description: true,
  imageUrls: true,
  productId: true,
  createdAt: true,
  updatedAt: true,
  reporter: { select: { id: true, nickname: true, avatarUrl: true } },
  targetUser: { select: { id: true, nickname: true, avatarUrl: true } },
} as const

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReportDto, reporterId: string) {
    if (dto.type !== 'BUG' && !dto.targetUserId) {
      throw new BadRequestException('사용자 신고 시 피신고자 ID가 필요합니다')
    }

    if (dto.targetUserId === reporterId) {
      throw new BadRequestException('자기 자신을 신고할 수 없습니다')
    }

    if (dto.targetUserId) {
      const target = await this.prisma.user.findUnique({ where: { id: dto.targetUserId } })
      if (!target) {
        throw new NotFoundException('피신고자를 찾을 수 없습니다')
      }
    }

    const report = await this.prisma.report.create({
      data: {
        type: dto.type,
        description: dto.description,
        imageUrls: dto.imageUrls ?? [],
        reporterId,
        targetUserId: dto.type === 'BUG' ? null : dto.targetUserId,
        productId: dto.productId,
      },
      select: REPORT_SELECT,
    })

    return report
  }

  async findMyReports(userId: string) {
    return this.prisma.report.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
      select: REPORT_SELECT,
    })
  }
}
