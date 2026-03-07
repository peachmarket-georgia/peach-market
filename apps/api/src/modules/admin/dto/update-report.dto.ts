import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { ReportStatus } from '@prisma/client'

export class UpdateReportDto {
  @ApiPropertyOptional({ enum: ReportStatus, description: '신고 처리 상태' })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus

  @ApiPropertyOptional({ description: '관리자 메모', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string
}
