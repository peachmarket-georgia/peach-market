import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ChatService } from './chat.service'
import { PushService } from '../modules/push/push.service'
import { Logger } from '@nestjs/common'

/**
 * Get WebSocket CORS origins from environment variables
 */
function getWebSocketCorsOrigins(): string[] {
  const origins: string[] = []

  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000', 'http://localhost:3003')
  }

  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL)
  }

  if (process.env.ALLOWED_ORIGINS) {
    const additional = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    origins.push(...additional)
  }

  return [...new Set(origins)]
}

@WebSocketGateway({
  cors: {
    origin: getWebSocketCorsOrigins(),
    credentials: true,
  },
  namespace: 'chat',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class ChatGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(ChatGateway.name)

  constructor(
    private readonly chatService: ChatService,
    private readonly pushService: PushService
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized')
    this.logger.log(`CORS origins: ${getWebSocketCorsOrigins().join(', ')}`)
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: { roomId: string; userId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomId)
    this.logger.log(`Client ${client.id} joined room ${data.roomId}`)
    return { event: 'joinedRoom', data: data.roomId }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.leave(roomId)
    this.logger.log(`Client ${client.id} left room ${roomId}`)
    return { event: 'leftRoom', data: roomId }
  }

  @SubscribeMessage('joinUserRoom')
  handleJoinUserRoom(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    client.join(`user:${data.userId}`)
    return { event: 'joinedUserRoom', data: `user:${data.userId}` }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      chatRoomId: string
      senderId: string
      content: string
    }
  ) {
    const savedMessage = await this.chatService.saveMessage(data.chatRoomId, data.senderId, data.content)
    this.server.to(data.chatRoomId).emit('newMessage', savedMessage)

    // 3. 수신자의 개인 채널에 안읽은 메시지 알림 + PWA push
    const room = await this.chatService.findChatRoomById(data.chatRoomId)
    if (room) {
      const recipientId = room.buyerId === data.senderId ? room.sellerId : room.buyerId
      this.server.to(`user:${recipientId}`).emit('newUnreadMessage', { chatRoomId: data.chatRoomId })

      // 수신자가 채팅방에 없을 때 push 알림 전송
      const recipientSockets = await this.server.in(data.chatRoomId).fetchSockets()
      const recipientInRoom = recipientSockets.some((s) => s.rooms.has(`user:${recipientId}`))
      if (!recipientInRoom) {
        const sender = await this.chatService.findUserById(data.senderId)
        await this.pushService.sendToUser(recipientId, {
          title: sender?.nickname ?? '피치마켓',
          body: data.content.length > 50 ? data.content.slice(0, 50) + '...' : data.content,
          url: `/chat/${data.chatRoomId}`,
        })
      }
    }

    return savedMessage
  }

  @SubscribeMessage('productStatusUpdate')
  handleProductStatusUpdate(
    @MessageBody() data: { chatRoomId: string; status: string },
    @ConnectedSocket() client: Socket
  ) {
    client.to(data.chatRoomId).emit('productStatusUpdated', { status: data.status })
  }

  @SubscribeMessage('productHiddenUpdate')
  handleProductHiddenUpdate(
    @MessageBody() data: { chatRoomId: string; isHidden: boolean },
    @ConnectedSocket() client: Socket
  ) {
    client.to(data.chatRoomId).emit('productHiddenUpdated', { isHidden: data.isHidden })
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { chatRoomId: string; userId: string },
    @ConnectedSocket() client: Socket
  ) {
    await this.chatService.markMessagesAsRead(data.chatRoomId, data.userId)
    // 같은 방의 상대방에게 읽음 처리 알림 (선택적)
    client.to(data.chatRoomId).emit('messagesRead', { chatRoomId: data.chatRoomId, userId: data.userId })
  }

  // 테스트용: DB 저장 없이 메시지만 브로드캐스트
  @SubscribeMessage('sendTestMessage')
  handleSendTestMessage(
    @MessageBody()
    data: {
      roomId: string
      senderId: string
      content: string
    }
  ) {
    const testMessage = {
      id: crypto.randomUUID(),
      content: data.content,
      senderId: data.senderId,
      createdAt: new Date().toISOString(),
    }
    this.server.to(data.roomId).emit('newMessage', testMessage)
    return testMessage
  }
}
