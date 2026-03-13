import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CompleteProfileDto {
  @ApiProperty({ description: '닉네임 (2-20자)', example: '피치유저' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  nickname: string

  @ApiProperty({ description: '거주 지역', example: 'Duluth' })
  @IsString()
  @IsNotEmpty()
  location: string
}
