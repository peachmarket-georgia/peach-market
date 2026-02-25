import { ApiProperty } from '@nestjs/swagger'
import { User } from '@prisma/client'

export type UserResponseDto = Omit<User, 'password'>

export class UserProfileResponseDto {
  @ApiProperty({ example: 'user-id' })
  id: string

  @ApiProperty({ example: 'user@example.com' })
  email: string

  @ApiProperty({ example: '피치유저' })
  nickname: string

  @ApiProperty({ example: 'Georgia' })
  location: string

  @ApiProperty({ example: true })
  isEmailVerified: boolean

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date
}
