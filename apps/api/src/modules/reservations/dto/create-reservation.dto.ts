import { IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateReservationDto {
  @ApiProperty({ description: '예약할 상품 ID' })
  @IsUUID()
  productId: string

  @ApiProperty({ description: '구매자 ID (채팅 상대방)' })
  @IsUUID()
  buyerId: string
}
