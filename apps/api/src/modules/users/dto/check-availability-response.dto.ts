import { ApiProperty } from '@nestjs/swagger'

export class CheckAvailabilityResponseDto {
  @ApiProperty({
    description: 'true: 사용 가능, false: 이미 사용 중',
    example: true,
  })
  available: boolean
}
