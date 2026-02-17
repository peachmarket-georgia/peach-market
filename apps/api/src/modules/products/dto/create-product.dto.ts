import {
  IsString,
  IsInt,
  IsArray,
  MaxLength,
  Min,
  ArrayMaxSize,
  ArrayMinSize,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ description: '상품 제목', maxLength: 50, example: '아이폰 15 프로' })
  @IsString()
  @MaxLength(50)
  title: string;

  @ApiProperty({ description: '상품 설명', maxLength: 2000, example: '거의 새 제품입니다. 케이스와 함께 판매합니다.' })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ description: '가격 (센트 단위)', example: 80000, minimum: 0 })
  @IsInt()
  @Min(0)
  price: number;

  @ApiProperty({ description: '카테고리', example: '디지털기기' })
  @IsString()
  category: string;

  @ApiProperty({ description: '이미지 URL 배열 (1-5장)', type: [String], example: ['https://example.com/image1.jpg'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ description: '거래 희망 지역', example: 'Duluth' })
  @IsString()
  location: string;

  @ApiPropertyOptional({
    description: '선호 결제 수단',
    enum: PaymentMethod,
    isArray: true,
    example: ['CASH', 'ZELLE'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  paymentMethods?: PaymentMethod[];
}
