import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsUUID, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ReportType } from '@prisma/client'

export class CreateReportDto {
  @ApiProperty({ enum: ReportType, description: '신고 유형' })
  @IsEnum(ReportType)
  type!: ReportType

  @ApiProperty({ description: '신고 내용', maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description!: string

  @ApiPropertyOptional({ description: '피신고자 ID (사용자 신고 시 필수)' })
  @IsOptional()
  @IsUUID()
  targetUserId?: string

  @ApiPropertyOptional({ description: '관련 상품 ID' })
  @IsOptional()
  @IsUUID()
  productId?: string

  @ApiPropertyOptional({ description: '증거 이미지 URL', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[]
}
