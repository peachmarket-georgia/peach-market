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

  @ApiProperty({ example: 33.9462, nullable: true })
  lat: number | null

  @ApiProperty({ example: -84.2132, nullable: true })
  lng: number | null

  @ApiProperty({ example: 10, nullable: true })
  searchRadiusMiles: number | null

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date
}
