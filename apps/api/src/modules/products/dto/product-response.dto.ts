import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ProductStatus, PaymentMethod } from '@prisma/client'

export class ProductSellerDto {
  @ApiProperty({ description: '판매자 ID' })
  id: string

  @ApiProperty({ description: '판매자 닉네임' })
  nickname: string

  @ApiPropertyOptional({ description: '판매자 프로필 이미지', nullable: true })
  avatarUrl: string | null

  @ApiProperty({ description: '판매자 활동 지역' })
  location: string
}

export class ProductResponseDto {
  @ApiProperty({ description: '상품 ID' })
  id: string

  @ApiProperty({ description: '상품 제목' })
  title: string

  @ApiProperty({ description: '상품 설명' })
  description: string

  @ApiProperty({ description: '가격 (센트 단위)' })
  price: number

  @ApiProperty({ description: '카테고리' })
  category: string

  @ApiProperty({ description: '상태', enum: ProductStatus })
  status: ProductStatus

  @ApiProperty({ description: '이미지 URL 배열', type: [String] })
  images: string[]

  @ApiProperty({ description: '거래 희망 지역' })
  location: string

  @ApiPropertyOptional({ description: '거래 희망 위치 위도', nullable: true })
  lat: number | null

  @ApiPropertyOptional({ description: '거래 희망 위치 경도', nullable: true })
  lng: number | null

  @ApiProperty({ description: '선호 결제 수단', enum: PaymentMethod, isArray: true })
  paymentMethods: PaymentMethod[]

  @ApiProperty({ description: '조회수' })
  viewCount: number

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date

  @ApiProperty({ description: '판매자 정보', type: ProductSellerDto })
  seller: ProductSellerDto

  @ApiProperty({ description: '찜 수' })
  favoriteCount: number

  @ApiProperty({ description: '현재 사용자의 찜 여부' })
  isFavorited: boolean
}

export class ProductListResponseDto {
  @ApiProperty({ description: '상품 목록', type: [ProductResponseDto] })
  products: ProductResponseDto[]

  @ApiPropertyOptional({ description: '다음 페이지 커서', nullable: true })
  nextCursor: string | null

  @ApiProperty({ description: '더 많은 상품이 있는지 여부' })
  hasMore: boolean
}

export class UpdateStatusDto {
  @ApiProperty({ description: '변경할 상태', enum: ProductStatus })
  status: ProductStatus
}
