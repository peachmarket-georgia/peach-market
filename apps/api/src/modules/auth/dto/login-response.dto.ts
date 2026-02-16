import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

export type UserWithoutPassword = Omit<User, 'password'>;

export class LoginResponseDto {
  @ApiProperty({
    description: '로그인한 사용자 정보 (비밀번호 제외)',
    example: {
      id: 'user-id',
      email: 'user@example.com',
      nickname: '피치유저',
      location: 'Georgia',
      isEmailVerified: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })
  user: UserWithoutPassword;
}
