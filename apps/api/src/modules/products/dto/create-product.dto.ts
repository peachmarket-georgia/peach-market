import { IsString, IsInt, IsNotEmpty, IsArray, MaxLength, Min, IsEnum, IsOptional, IsNumber } from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { PaymentMethod } from '@prisma/client'

export class CreateProductDto {
  @ApiProperty({ example: '아이폰 15 프로', description: '상품 제목', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title!: string

  @ApiProperty({ example: '상태 좋습니다. 직거래 원합니다.', description: '상품 설명' })
  @IsString()
  @IsNotEmpty()
  description!: string

  @ApiProperty({ example: 500, description: '가격 (USD)', minimum: 0 })
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  @IsInt()
  @Min(0)
  price!: number

  @ApiProperty({ example: '전자기기', description: '카테고리' })
  @IsString()
  @IsNotEmpty()
  category!: string

  @ApiProperty({ example: 'Duluth', description: '거래 희망 지역' })
  @IsString()
  @IsNotEmpty()
  location!: string

  @ApiPropertyOptional({ example: ['https://...'], description: '상품 이미지 URL 목록', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @ApiPropertyOptional({ example: 33.9462, description: '거래 희망 위치 위도' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number

  @ApiPropertyOptional({ example: -84.2132, description: '거래 희망 위치 경도' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number

  @ApiPropertyOptional({
    description: '선호 결제 수단',
    enum: PaymentMethod,
    isArray: true,
    example: ['CASH', 'ZELLE'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  paymentMethods?: PaymentMethod[]
}
