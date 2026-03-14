import { IsString, IsOptional, MinLength, MaxLength, IsUrl, IsNumber, IsInt, Min, Max } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '닉네임 (2-20자)', example: '피치유저' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nickname?: string

  @ApiPropertyOptional({ description: '활동 지역', example: 'Duluth' })
  @IsOptional()
  @IsString()
  location?: string

  @ApiPropertyOptional({ description: '프로필 이미지 URL', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string

  @ApiPropertyOptional({ description: 'GPS 위도', example: 33.9462 })
  @IsOptional()
  @IsNumber()
  lat?: number

  @ApiPropertyOptional({ description: 'GPS 경도', example: -84.2132 })
  @IsOptional()
  @IsNumber()
  lng?: number

  @ApiPropertyOptional({ description: '검색 반경 (miles, 0=거리무관)', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  searchRadiusMiles?: number
}
