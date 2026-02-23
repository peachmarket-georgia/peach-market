import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요' })
  @IsNotEmpty({ message: '이메일은 필수입니다' })
  email: string

  @ApiProperty({
    description: '비밀번호',
    example: 'password123!',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: '비밀번호는 필수입니다' })
  password: string
}
