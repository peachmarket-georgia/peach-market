import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { ReportType, ReportStatus, ProductStatus } from '@prisma/client'
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

const ADMIN_PRODUCT_SELECT = {
  id: true,
  title: true,
  price: true,
  category: true,
  status: true,
  isHidden: true,
  images: true,
  location: true,
  viewCount: true,
  createdAt: true,
  seller: { select: { id: true, nickname: true, email: true, avatarUrl: true } },
  _count: { select: { favorites: true, reports: true } },
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

  async getStats() {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      newUsersLast7Days,
      blockedUsers,
      totalProducts,
      activeProducts,
      totalReports,
      pendingReports,
      reviewingReports,
      recentReports,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.user.count({ where: { isBlocked: true } }),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { status: { in: ['SELLING', 'RESERVED'] } } }),
      this.prisma.report.count(),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.report.count({ where: { status: 'REVIEWING' } }),
      this.prisma.report.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: REPORT_DETAIL_SELECT,
      }),
    ])

    return {
      users: { total: totalUsers, newLast7Days: newUsersLast7Days, blocked: blockedUsers },
      products: { total: totalProducts, active: activeProducts },
      reports: { total: totalReports, pending: pendingReports, reviewing: reviewingReports },
      recentReports,
    }
  }

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

  // ==================== 상품 관리 ====================

  async findAllProducts(filters: { search?: string; status?: ProductStatus; category?: string }) {
    const where: Record<string, unknown> = {}

    if (filters.search) {
      where.OR = [{ title: { contains: filters.search } }, { seller: { nickname: { contains: filters.search } } }]
    }
    if (filters.status) where.status = filters.status
    if (filters.category) where.category = filters.category

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: ADMIN_PRODUCT_SELECT,
    })

    return products.map((p) => {
      const { _count, ...rest } = p
      return { ...rest, favoriteCount: _count.favorites, reportCount: _count.reports }
    })
  }

  async deleteProduct(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다')
    }

    await this.prisma.product.delete({ where: { id: productId } })

    return { message: '상품이 삭제되었습니다' }
  }

  async updateProductStatus(productId: string, status: ProductStatus) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다')
    }

    await this.prisma.product.update({ where: { id: productId }, data: { status } })

    return { message: '상품 상태가 변경되었습니다' }
  }

  async toggleProductHidden(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다')
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { isHidden: !product.isHidden },
    })

    return { message: product.isHidden ? '상품 숨김이 해제되었습니다' : '상품이 숨김 처리되었습니다' }
  }
}
