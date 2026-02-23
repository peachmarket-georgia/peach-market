import { IsEmail } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ResendVerificationDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '인증 이메일을 재발송할 이메일 주소',
  })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요' })
  email: string
}
