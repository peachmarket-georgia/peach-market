import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatRoomDto {
  @ApiProperty({ description: '상품 ID', example: 'uuid-product-id' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;
}
