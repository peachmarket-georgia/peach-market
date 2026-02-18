import { IsString, IsOptional, MinLength, MaxLength, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '닉네임 (2-20자)', example: '피치유저' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nickname?: string;

  @ApiPropertyOptional({ description: '활동 지역', example: 'Duluth' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '프로필 이미지 URL', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
