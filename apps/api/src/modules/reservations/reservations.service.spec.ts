import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common'
import { ProductStatus, ReservationStatus } from '@prisma/client'
import { ReservationsService } from './reservations.service'
import { PrismaService } from '../../core/database/prisma.service'
import { ChatGateway } from '../../chat/chat.gateway'

describe('ReservationsService', () => {
  let service: ReservationsService
  let prisma: Record<string, any>

  const mockReservation = {
    id: 'res-1',
    productId: 'product-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    status: ReservationStatus.RESERVED,
    buyerConfirmedAt: null,
    sellerConfirmedAt: null,
    completedAt: null,
    canceledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: { id: 'product-1', title: '상품', price: 100, images: [], status: ProductStatus.RESERVED },
    buyer: { id: 'buyer-1', nickname: '구매자', avatarUrl: null },
    seller: { id: 'seller-1', nickname: '판매자', avatarUrl: null },
  }

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      product: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      reservation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    }

    const mockChatGateway = {
      server: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) },
    }

    prisma.chatRoom = { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() }
    prisma.message = { create: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ChatGateway, useValue: mockChatGateway },
      ],
    }).compile()

    service = module.get<ReservationsService>(ReservationsService)
  })

  describe('create', () => {
    const createDto = { productId: 'product-1', buyerId: 'buyer-1' }

    it('정상적으로 예약을 생성해야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ sellerId: 'seller-1', status: ProductStatus.SELLING })
      prisma.user.findUnique.mockResolvedValue({ id: 'buyer-1' })
      prisma.reservation.findUnique.mockResolvedValue(null)
      prisma.$transaction.mockResolvedValue([mockReservation, {}])

      const result = await service.create(createDto, 'seller-1')

      expect(result).toEqual(mockReservation)
    })

    it('존재하지 않는 상품이면 NotFoundException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue(null)

      await expect(service.create(createDto, 'seller-1')).rejects.toThrow(NotFoundException)
    })

    it('본인 상품이 아니면 ForbiddenException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ sellerId: 'other-seller', status: ProductStatus.SELLING })

      await expect(service.create(createDto, 'seller-1')).rejects.toThrow(ForbiddenException)
    })

    it('판매 중이 아닌 상품이면 BadRequestException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ sellerId: 'seller-1', status: ProductStatus.RESERVED })

      await expect(service.create(createDto, 'seller-1')).rejects.toThrow(BadRequestException)
    })

    it('본인과 거래하려 하면 BadRequestException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ sellerId: 'seller-1', status: ProductStatus.SELLING })

      await expect(service.create({ productId: 'product-1', buyerId: 'seller-1' }, 'seller-1')).rejects.toThrow(
        BadRequestException
      )
    })

    it('구매자가 존재하지 않으면 NotFoundException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ sellerId: 'seller-1', status: ProductStatus.SELLING })
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.create(createDto, 'seller-1')).rejects.toThrow(NotFoundException)
    })

    it('이미 진행 중인 예약이 있으면 ConflictException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ sellerId: 'seller-1', status: ProductStatus.SELLING })
      prisma.user.findUnique.mockResolvedValue({ id: 'buyer-1' })
      prisma.reservation.findUnique.mockResolvedValue({ status: ReservationStatus.RESERVED })

      await expect(service.create(createDto, 'seller-1')).rejects.toThrow(ConflictException)
    })
  })

  describe('confirm', () => {
    it('판매자가 거래 완료를 확인해야 한다', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        productId: 'product-1',
        sellerId: 'seller-1',
        status: ReservationStatus.RESERVED,
        sellerConfirmedAt: null,
      })
      const completedReservation = { ...mockReservation, status: ReservationStatus.COMPLETED }
      prisma.$transaction.mockResolvedValue([completedReservation, {}])

      const result = await service.confirm('res-1', 'seller-1')

      expect(result.status).toBe(ReservationStatus.COMPLETED)
    })

    it('존재하지 않는 예약이면 NotFoundException을 던져야 한다', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null)

      await expect(service.confirm('nonexistent', 'seller-1')).rejects.toThrow(NotFoundException)
    })

    it('판매자가 아니면 ForbiddenException을 던져야 한다', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        sellerId: 'seller-1',
        status: ReservationStatus.RESERVED,
        sellerConfirmedAt: null,
      })

      await expect(service.confirm('res-1', 'other-user')).rejects.toThrow(ForbiddenException)
    })

    it('RESERVED 상태가 아니면 BadRequestException을 던져야 한다', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        sellerId: 'seller-1',
        status: ReservationStatus.COMPLETED,
        sellerConfirmedAt: null,
      })

      await expect(service.confirm('res-1', 'seller-1')).rejects.toThrow(BadRequestException)
    })

    it('이미 확인한 경우 BadRequestException을 던져야 한다', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        sellerId: 'seller-1',
        status: ReservationStatus.RESERVED,
        sellerConfirmedAt: new Date(),
      })

      await expect(service.confirm('res-1', 'seller-1')).rejects.toThrow(BadRequestException)
    })
  })

  describe('cancel', () => {
    it('판매자가 예약을 취소해야 한다', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        productId: 'product-1',
        sellerId: 'seller-1',
        status: ReservationStatus.RESERVED,
      })
      const canceledReservation = { ...mockReservation, status: ReservationStatus.CANCELED }
      prisma.$transaction.mockResolvedValue([canceledReservation, {}])

      const result = await service.cancel('res-1', 'seller-1')

      expect(result.status).toBe(ReservationStatus.CANCELED)
    })

    it('판매자가 아니면 ForbiddenException을 던져야 한다', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        sellerId: 'seller-1',
        status: ReservationStatus.RESERVED,
      })

      await expect(service.cancel('res-1', 'other-user')).rejects.toThrow(ForbiddenException)
    })

    it('RESERVED 상태가 아니면 BadRequestException을 던져야 한다', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        sellerId: 'seller-1',
        status: ReservationStatus.COMPLETED,
      })

      await expect(service.cancel('res-1', 'seller-1')).rejects.toThrow(BadRequestException)
    })
  })

  describe('findMy', () => {
    it('구매자 역할로 필터링해야 한다', async () => {
      prisma.reservation.findMany.mockResolvedValue([mockReservation])

      await service.findMy('buyer-1', 'buyer')

      expect(prisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { buyerId: 'buyer-1' } })
      )
    })

    it('판매자 역할로 필터링해야 한다', async () => {
      prisma.reservation.findMany.mockResolvedValue([])

      await service.findMy('seller-1', 'seller')

      expect(prisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sellerId: 'seller-1' } })
      )
    })

    it('역할 없으면 양쪽 모두 조회해야 한다', async () => {
      prisma.reservation.findMany.mockResolvedValue([])

      await service.findMy('user-1')

      expect(prisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { OR: [{ buyerId: 'user-1' }, { sellerId: 'user-1' }] },
        })
      )
    })
  })

  describe('findOne', () => {
    it('관련 유저가 예약을 조회해야 한다', async () => {
      prisma.reservation.findUnique.mockResolvedValue(mockReservation)

      const result = await service.findOne('res-1', 'buyer-1')

      expect(result).toEqual(mockReservation)
    })

    it('존재하지 않는 예약이면 NotFoundException을 던져야 한다', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null)

      await expect(service.findOne('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('관련 없는 유저면 ForbiddenException을 던져야 한다', async () => {
      prisma.reservation.findUnique.mockResolvedValue(mockReservation)

      await expect(service.findOne('res-1', 'stranger')).rejects.toThrow(ForbiddenException)
    })
  })
})
