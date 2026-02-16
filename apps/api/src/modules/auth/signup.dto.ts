import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요' })
  @IsNotEmpty({ message: '이메일은 필수입니다' })
  email: string;

  @ApiProperty({
    description: '비밀번호 (최소 8자)',
    example: 'password123!',
    minLength: 8,
    type: String,
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @IsNotEmpty({ message: '비밀번호는 필수입니다' })
  password: string;

  @ApiProperty({
    description: '닉네임 (2-20자)',
    example: '피치유저',
    minLength: 2,
    maxLength: 20,
    type: String,
  })
  @IsString()
  @Length(2, 20, { message: '닉네임은 2-20자 사이여야 합니다' })
  @IsNotEmpty({ message: '닉네임은 필수입니다' })
  nickname: string;

  @ApiProperty({
    description: '거주 지역 (미국 조지아주 내)',
    example: 'Atlanta, GA',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: '거주 지역은 필수입니다' })
  location: string;
}
