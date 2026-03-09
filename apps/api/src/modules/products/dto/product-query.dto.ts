import { IsOptional, IsString, IsEnum, IsInt, IsNumber, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { ProductStatus } from '@prisma/client'

export class ProductQueryDto {
  @ApiPropertyOptional({ description: 'Cursor for pagination' })
  @IsOptional()
  @IsString()
  cursor?: string

  @ApiPropertyOptional({ description: '페이지당 상품 수', default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20

  @ApiPropertyOptional({ description: '검색 키워드' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ description: '카테고리 필터' })
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional({ description: '상태 필터', enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus

  @ApiPropertyOptional({ description: '정렬 방식', enum: ['latest', 'price_asc', 'price_desc'], default: 'latest' })
  @IsOptional()
  @IsString()
  sort?: 'latest' | 'price_asc' | 'price_desc' = 'latest'

  @ApiPropertyOptional({ description: '필터 기준 위도 (radius와 함께 사용)', example: 33.9462 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number

  @ApiPropertyOptional({ description: '필터 기준 경도 (radius와 함께 사용)', example: -84.2132 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number

  @ApiPropertyOptional({ description: '검색 반경 (km)', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radius?: number
}
