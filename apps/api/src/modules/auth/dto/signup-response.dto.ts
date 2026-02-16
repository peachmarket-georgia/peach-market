import { ApiProperty } from '@nestjs/swagger';

export class SignupResponseDto {
  @ApiProperty({ example: '회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.' })
  message: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;
}
