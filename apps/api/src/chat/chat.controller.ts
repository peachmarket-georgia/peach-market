import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateChatRoomDto } from './dto';

type AuthenticatedRequest = {
  user: { userId: string; email: string };
};

@ApiTags('chat')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({ summary: '내 채팅방 목록 조회' })
  @ApiResponse({ status: 200, description: '채팅방 목록 반환' })
  async getMyRooms(@Req() req: AuthenticatedRequest) {
    return this.chatService.getChatRoomsWithUnreadCount(req.user.userId);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: '채팅방 상세 조회 (메시지 포함)' })
  @ApiResponse({ status: 200, description: '채팅방 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '채팅방을 찾을 수 없음' })
  @ApiResponse({ status: 403, description: '접근 권한 없음' })
  async getRoom(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const room = await this.chatService.findChatRoomByIdWithMessages(id);
    if (!room) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다');
    }

    // Verify access
    if (room.buyerId !== req.user.userId && room.sellerId !== req.user.userId) {
      throw new ForbiddenException('이 채팅방에 접근할 권한이 없습니다');
    }

    return room;
  }

  @Post('rooms')
  @ApiOperation({ summary: '채팅방 생성 (상품 기반)' })
  @ApiResponse({ status: 201, description: '채팅방 생성 성공' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음' })
  @ApiResponse({ status: 400, description: '자신의 상품에 채팅 불가' })
  async createRoom(@Body() createChatRoomDto: CreateChatRoomDto, @Req() req: AuthenticatedRequest) {
    return this.chatService.createChatRoom(createChatRoomDto.productId, req.user.userId);
  }

  @Patch('rooms/:id/read')
  @ApiOperation({ summary: '메시지 읽음 처리' })
  @ApiResponse({ status: 200, description: '읽음 처리 완료' })
  async markAsRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.chatService.markMessagesAsRead(id, req.user.userId);
    return { message: '읽음 처리 완료' };
  }

  @Get('unread-count')
  @ApiOperation({ summary: '전체 안읽은 메시지 수' })
  @ApiResponse({ status: 200, description: '안읽은 메시지 수 반환' })
  async getUnreadCount(@Req() req: AuthenticatedRequest) {
    const count = await this.chatService.getTotalUnreadCount(req.user.userId);
    return { count };
  }
}
