import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { ProductStatus } from '@prisma/client'
import { AdminService } from './admin.service'
import { PrismaService } from '../../core/database/prisma.service'

describe('AdminService', () => {
  let service: AdminService
  let prisma: Record<string, any>

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    nickname: '테스터',
    role: 'USER',
    isBlocked: false,
  }

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      user: {
        count: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      product: {
        count: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      report: {
        count: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      session: {
        deleteMany: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get<AdminService>(AdminService)
  })

  describe('getStats', () => {
    it('대시보드 통계를 반환해야 한다', async () => {
      prisma.user.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(10) // newUsersLast7Days
        .mockResolvedValueOnce(2) // blockedUsers
      prisma.product.count
        .mockResolvedValueOnce(50) // totalProducts
        .mockResolvedValueOnce(30) // activeProducts
      prisma.report.count
        .mockResolvedValueOnce(20) // totalReports
        .mockResolvedValueOnce(5) // pendingReports
        .mockResolvedValueOnce(3) // reviewingReports
      prisma.report.findMany.mockResolvedValue([])

      const result = await service.getStats()

      expect(result.users).toEqual({ total: 100, newLast7Days: 10, blocked: 2 })
      expect(result.products).toEqual({ total: 50, active: 30 })
      expect(result.reports).toEqual({ total: 20, pending: 5, reviewing: 3 })
    })
  })

  describe('blockUser', () => {
    it('유저를 차단하고 세션을 삭제해야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)
      prisma.$transaction.mockResolvedValue([{}, {}])

      const result = await service.blockUser('user-1')

      expect(result.message).toContain('차단')
    })

    it('존재하지 않는 유저면 NotFoundException을 던져야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.blockUser('nonexistent')).rejects.toThrow(NotFoundException)
    })

    it('이미 차단된 유저면 BadRequestException을 던져야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isBlocked: true })

      await expect(service.blockUser('user-1')).rejects.toThrow(BadRequestException)
    })
  })

  describe('unblockUser', () => {
    it('차단을 해제해야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isBlocked: true })
      prisma.user.update.mockResolvedValue(undefined)

      const result = await service.unblockUser('user-1')

      expect(result.message).toContain('해제')
    })

    it('차단되지 않은 유저면 BadRequestException을 던져야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)

      await expect(service.unblockUser('user-1')).rejects.toThrow(BadRequestException)
    })
  })

  describe('promoteUser', () => {
    it('관리자 권한을 부여해야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)
      prisma.user.update.mockResolvedValue(undefined)

      const result = await service.promoteUser('user-1')

      expect(result.message).toContain('부여')
    })

    it('이미 관리자면 BadRequestException을 던져야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, role: 'ADMIN' })

      await expect(service.promoteUser('user-1')).rejects.toThrow(BadRequestException)
    })
  })

  describe('demoteUser', () => {
    it('관리자 권한을 해제해야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, role: 'ADMIN' })
      prisma.user.update.mockResolvedValue(undefined)

      const result = await service.demoteUser('user-1')

      expect(result.message).toContain('해제')
    })

    it('이미 일반 사용자면 BadRequestException을 던져야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)

      await expect(service.demoteUser('user-1')).rejects.toThrow(BadRequestException)
    })
  })

  describe('findAllReports', () => {
    it('필터 없이 모든 신고를 반환해야 한다', async () => {
      prisma.report.findMany.mockResolvedValue([])

      await service.findAllReports({})

      expect(prisma.report.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
    })

    it('타입과 상태로 필터링해야 한다', async () => {
      prisma.report.findMany.mockResolvedValue([])

      await service.findAllReports({ type: 'BUG' as any, status: 'PENDING' as any })

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { type: 'BUG', status: 'PENDING' } })
      )
    })
  })

  describe('updateReport', () => {
    it('신고 상태를 업데이트해야 한다', async () => {
      prisma.report.findUnique.mockResolvedValue({ id: 'report-1' })
      prisma.report.update.mockResolvedValue({ id: 'report-1', status: 'RESOLVED' })

      await service.updateReport('report-1', { status: 'RESOLVED' as any })

      expect(prisma.report.update).toHaveBeenCalled()
    })

    it('존재하지 않는 신고면 NotFoundException을 던져야 한다', async () => {
      prisma.report.findUnique.mockResolvedValue(null)

      await expect(service.updateReport('nonexistent', { status: 'RESOLVED' as any })).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('deleteProduct', () => {
    it('상품을 삭제해야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'product-1' })
      prisma.product.delete.mockResolvedValue(undefined)

      const result = await service.deleteProduct('product-1')

      expect(result.message).toContain('삭제')
    })

    it('존재하지 않는 상품이면 NotFoundException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue(null)

      await expect(service.deleteProduct('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateProductStatus', () => {
    it('상품 상태를 변경해야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'product-1' })
      prisma.product.update.mockResolvedValue(undefined)

      const result = await service.updateProductStatus('product-1', ProductStatus.ENDED)

      expect(result.message).toContain('변경')
    })

    it('존재하지 않는 상품이면 NotFoundException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue(null)

      await expect(service.updateProductStatus('nonexistent', ProductStatus.ENDED)).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAllUsers', () => {
    it('검색어로 필터링해야 한다', async () => {
      prisma.user.findMany.mockResolvedValue([])

      await service.findAllUsers({ search: '테스트' })

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([{ nickname: { contains: '테스트' } }]),
          }),
        })
      )
    })

    it('차단 상태로 필터링해야 한다', async () => {
      prisma.user.findMany.mockResolvedValue([])

      await service.findAllUsers({ blocked: 'true' })

      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isBlocked: true } }))
    })
  })
})
