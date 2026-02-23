import {
  IsString,
  IsInt,
  IsNotEmpty,
  IsArray,
  MaxLength,
  Min,
  ArrayMaxSize,
  ArrayMinSize,
  IsEnum,
  IsOptional,
} from 'class-validator'
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
  @IsInt()
  @Min(0)
  price!: number

  @ApiProperty({ example: '전자기기', description: '카테고리' })
  @IsString()
  @IsNotEmpty()
  category!: string

  @ApiProperty({ description: '이미지 URL 배열 (1-5장)', type: [String], example: ['https://example.com/image1.jpg'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  images!: string[]

  @ApiProperty({ example: 'Duluth', description: '거래 희망 지역' })
  @IsString()
  @IsNotEmpty()
  location!: string

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
