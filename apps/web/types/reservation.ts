import type { ProductStatus } from './api'

export type ReservationStatus = 'RESERVED' | 'COMPLETED' | 'CANCELED'

export interface ReservationUserDto {
  id: string
  nickname: string
  avatarUrl: string | null
}

export interface ReservationProductDto {
  id: string
  title: string
  price: number
  images: string[]
  status: ProductStatus
}

export interface ReservationDto {
  id: string
  productId: string
  buyerId: string
  sellerId: string
  status: ReservationStatus
  buyerConfirmedAt: string | null
  sellerConfirmedAt: string | null
  completedAt: string | null
  canceledAt: string | null
  createdAt: string
  updatedAt: string
  product: ReservationProductDto
  buyer: ReservationUserDto
  seller: ReservationUserDto
}
