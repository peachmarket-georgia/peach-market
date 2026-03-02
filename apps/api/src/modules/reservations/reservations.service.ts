import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common'
import { ProductStatus, ReservationStatus } from '@prisma/client'
import { PrismaService } from '../../core/database/prisma.service'
import { CreateReservationDto } from './dto/create-reservation.dto'

const USER_SELECT = {
  id: true,
  nickname: true,
  avatarUrl: true,
} as const

const RESERVATION_SELECT = {
  id: true,
  productId: true,
  buyerId: true,
  sellerId: true,
  status: true,
  buyerConfirmedAt: true,
  sellerConfirmedAt: true,
  completedAt: true,
  canceledAt: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      title: true,
      price: true,
      images: true,
      status: true,
    },
  },
  buyer: { select: USER_SELECT },
  seller: { select: USER_SELECT },
} as const

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 예약 생성
   * - 판매자가 채팅 상대방(구매자)을 지정하여 예약 생성
   * - 상품 status → RESERVED 자동 변경 (트랜잭션)
   */
  async create(dto: CreateReservationDto, sellerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { sellerId: true, status: true },
    })

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다')
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('본인의 상품만 예약 처리할 수 있습니다')
    }

    if (product.status !== ProductStatus.SELLING) {
      throw new BadRequestException('판매 중인 상품만 예약할 수 있습니다')
    }

    if (sellerId === dto.buyerId) {
      throw new BadRequestException('본인과 거래할 수 없습니다')
    }

    const buyer = await this.prisma.user.findUnique({
      where: { id: dto.buyerId },
      select: { id: true },
    })

    if (!buyer) {
      throw new NotFoundException('구매자를 찾을 수 없습니다')
    }

    // 기존 활성 예약 중복 확인
    const existingReservation = await this.prisma.reservation.findUnique({
      where: { productId_buyerId: { productId: dto.productId, buyerId: dto.buyerId } },
    })

    if (existingReservation && existingReservation.status === ReservationStatus.RESERVED) {
      throw new ConflictException('이미 진행 중인 예약이 있습니다')
    }

    // 트랜잭션: 예약 생성 + 상품 상태 RESERVED 변경
    const [reservation] = await this.prisma.$transaction([
      this.prisma.reservation.upsert({
        where: { productId_buyerId: { productId: dto.productId, buyerId: dto.buyerId } },
        create: {
          productId: dto.productId,
          buyerId: dto.buyerId,
          sellerId,
          status: ReservationStatus.RESERVED,
        },
        update: {
          status: ReservationStatus.RESERVED,
          buyerConfirmedAt: null,
          sellerConfirmedAt: null,
          completedAt: null,
          canceledAt: null,
        },
        select: RESERVATION_SELECT,
      }),
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { status: ProductStatus.RESERVED },
      }),
    ])

    return reservation
  }

  /**
   * 거래 완료 확인 (판매자 전용)
   * - 판매자가 확인하면 즉시 COMPLETED + Product→CONFIRMED (트랜잭션)
   * - 구매자 쌍방 확인 로직 보류 (buyerConfirmedAt 컬럼은 기록용으로 유지)
   */
  async confirm(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        productId: true,
        sellerId: true,
        status: true,
        sellerConfirmedAt: true,
      },
    })

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다')
    }

    if (reservation.sellerId !== userId) {
      throw new ForbiddenException('판매자만 거래 완료를 확인할 수 있습니다')
    }

    if (reservation.status !== ReservationStatus.RESERVED) {
      throw new BadRequestException(
        reservation.status === ReservationStatus.COMPLETED ? '이미 완료된 거래입니다' : '취소된 거래입니다'
      )
    }

    if (reservation.sellerConfirmedAt) {
      throw new BadRequestException('이미 판매 완료를 확인했습니다')
    }

    const now = new Date()

    const [updated] = await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id: reservationId },
        data: {
          sellerConfirmedAt: now,
          status: ReservationStatus.COMPLETED,
          completedAt: now,
        },
        select: RESERVATION_SELECT,
      }),
      this.prisma.product.update({
        where: { id: reservation.productId },
        data: { status: ProductStatus.CONFIRMED },
      }),
    ])

    return updated
  }

  /**
   * 예약 취소
   * - 판매자만 취소 가능
   * - Product.status → SELLING 복원 (트랜잭션)
   */
  async cancel(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true, productId: true, sellerId: true, status: true },
    })

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다')
    }

    if (reservation.sellerId !== userId) {
      throw new ForbiddenException('판매자만 예약을 취소할 수 있습니다')
    }

    if (reservation.status !== ReservationStatus.RESERVED) {
      throw new BadRequestException(
        reservation.status === ReservationStatus.COMPLETED
          ? '완료된 거래는 취소할 수 없습니다'
          : '이미 취소된 예약입니다'
      )
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id: reservationId },
        data: {
          status: ReservationStatus.CANCELED,
          canceledAt: new Date(),
        },
        select: RESERVATION_SELECT,
      }),
      this.prisma.product.update({
        where: { id: reservation.productId },
        data: { status: ProductStatus.SELLING },
      }),
    ])

    return updated
  }

  /**
   * 내 예약 목록 조회
   * - 구매자/판매자 모두 각자의 예약 목록 조회 가능
   */
  async findMy(userId: string, role?: 'buyer' | 'seller') {
    const where =
      role === 'buyer'
        ? { buyerId: userId }
        : role === 'seller'
          ? { sellerId: userId }
          : { OR: [{ buyerId: userId }, { sellerId: userId }] }

    return this.prisma.reservation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: RESERVATION_SELECT,
    })
  }

  /**
   * 예약 상세 조회
   */
  async findOne(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      select: RESERVATION_SELECT,
    })

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다')
    }

    if (reservation.buyerId !== userId && reservation.sellerId !== userId) {
      throw new ForbiddenException('해당 예약을 조회할 권한이 없습니다')
    }

    return reservation
  }

  /**
   * 상품 ID로 현재 활성 예약 조회 (채팅방에서 사용)
   */
  async findByProduct(productId: string, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        productId,
        status: { in: [ReservationStatus.RESERVED, ReservationStatus.COMPLETED] },
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      orderBy: { updatedAt: 'desc' },
      select: RESERVATION_SELECT,
    })

    return reservation // null이면 예약 없음
  }
}
