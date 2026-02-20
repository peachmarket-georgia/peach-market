import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { CurrentUser, type JwtUser } from '../modules/auth/current-user.decorator';
import { ChatService } from './chat.service';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('access_token')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({ summary: '내 채팅방 목록 조회', description: '로그인한 사용자의 채팅방 목록을 조회합니다.' })
  @ApiResponse({ status: 200, description: '채팅방 목록 반환' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async getRooms(@CurrentUser() { userId }: JwtUser) {
    return this.chatService.getChatRoomsWithUnreadCount(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '전체 안읽은 메시지 수', description: '모든 채팅방의 안읽은 메시지 총 개수를 조회합니다.' })
  @ApiResponse({ status: 200, description: '안읽은 메시지 수 반환' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async getUnreadCount(@CurrentUser() { userId }: JwtUser) {
    const count = await this.chatService.getTotalUnreadCount(userId);
    return { count };
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: '채팅방 상세 조회', description: '채팅방의 메시지와 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'id', description: '채팅방 ID' })
  @ApiResponse({ status: 200, description: '채팅방 상세 정보 반환' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '채팅방을 찾을 수 없음' })
  async getRoom(@Param('id') id: string) {
    return this.chatService.findChatRoomByIdWithMessages(id);
  }

  @Post('rooms')
  @ApiOperation({
    summary: '채팅방 생성',
    description: '상품 기반으로 채팅방을 생성합니다. 기존 채팅방이 있으면 해당 채팅방을 반환합니다.',
  })
  @ApiResponse({ status: 201, description: '채팅방 생성 성공' })
  @ApiResponse({ status: 400, description: '자신의 상품에는 채팅 불가' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음' })
  async createRoom(@Body() dto: CreateChatRoomDto, @CurrentUser() { userId }: JwtUser) {
    return this.chatService.createChatRoom(dto.productId, userId);
  }

  @Patch('rooms/:id/read')
  @ApiOperation({ summary: '메시지 읽음 처리', description: '채팅방의 메시지를 읽음 처리합니다.' })
  @ApiParam({ name: 'id', description: '채팅방 ID' })
  @ApiResponse({ status: 200, description: '읽음 처리 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async markAsRead(@Param('id') id: string, @CurrentUser() { userId }: JwtUser) {
    await this.chatService.markMessagesAsRead(id, userId);
    return { message: '읽음 처리되었습니다.' };
  }
}
