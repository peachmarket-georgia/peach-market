import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ChatService } from './chat.service'

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3003'],
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway {
  @WebSocketServer()
  server: Server

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: { roomId: string; userId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomId)
    console.log(`Client ${client.id} joined room ${data.roomId}`)
    return { event: 'joinedRoom', data: data.roomId }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.leave(roomId)
    console.log(`Client ${client.id} left room ${roomId}`)
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
    // 1. DB에 메시지 저장
    const savedMessage = await this.chatService.saveMessage(data.chatRoomId, data.senderId, data.content)

    // 2. 해당 방의 모든 클라이언트에게 메시지 전송
    this.server.to(data.chatRoomId).emit('newMessage', savedMessage)

    // 3. 수신자의 개인 채널에 안읽은 메시지 알림
    const room = await this.chatService.findChatRoomById(data.chatRoomId)
    if (room) {
      const recipientId = room.buyerId === data.senderId ? room.sellerId : room.buyerId
      this.server.to(`user:${recipientId}`).emit('newUnreadMessage', { chatRoomId: data.chatRoomId })
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
