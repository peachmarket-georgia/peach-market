import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ChatService } from './chat.service'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway {
  @WebSocketServer()
  server: Server

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket
  ) {
    client.join(data.roomId)
    console.log(`Client ${client.id} joined room ${data.roomId}`)
    return { event: 'joinedRoom', data: data.roomId }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket
  ) {
    client.leave(roomId)
    console.log(`Client ${client.id} left room ${roomId}`)
    return { event: 'leftRoom', data: roomId }
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
    const savedMessage = await this.chatService.saveMessage(
      data.chatRoomId,
      data.senderId,
      data.content
    )

    // 2. 해당 방의 모든 클라이언트에게 메시지 전송
    this.server.to(data.chatRoomId).emit('newMessage', savedMessage)

    return savedMessage
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
