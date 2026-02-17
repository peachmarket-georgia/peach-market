import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { AppConfigService } from '../core/config/config.service';

type AuthenticatedSocket = Socket & {
  data: {
    user?: { userId: string; email: string };
  };
};

function parseCookieFromHeader(cookieHeader: string | undefined, cookieName: string): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === cookieName && value) {
      return value;
    }
  }
  return null;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3003'],
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track online users: userId -> Set<socketId>
  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        console.log(`Client ${client.id} disconnected: No token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.jwtSecret,
      });

      client.data.user = { userId: payload.sub, email: payload.email };

      // Track online status
      const userId = payload.sub;
      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId)!.add(client.id);

      console.log(`User ${userId} connected (socket: ${client.id})`);
    } catch (error) {
      console.log(`Client ${client.id} disconnected: Invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data.user?.userId;
    if (userId && this.onlineUsers.has(userId)) {
      this.onlineUsers.get(userId)!.delete(client.id);
      if (this.onlineUsers.get(userId)!.size === 0) {
        this.onlineUsers.delete(userId);
      }
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  private extractToken(client: Socket): string | null {
    // Option 1: From handshake auth
    const authToken = client.handshake.auth?.token as string | undefined;
    if (authToken) return authToken;

    // Option 2: From cookies in handshake headers
    const cookieHeader = client.handshake.headers.cookie;
    if (cookieHeader) {
      return parseCookieFromHeader(cookieHeader, 'access_token');
    }

    return null;
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.data.user?.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    // Verify user is participant of this chat room
    const chatRoom = await this.chatService.findChatRoomById(data.roomId);
    if (!chatRoom || (chatRoom.buyerId !== userId && chatRoom.sellerId !== userId)) {
      return { error: 'Access denied' };
    }

    client.join(data.roomId);

    // Mark messages as read when joining
    await this.chatService.markMessagesAsRead(data.roomId, userId);

    console.log(`User ${userId} joined room ${data.roomId}`);
    return { event: 'joinedRoom', data: data.roomId };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() roomId: string, @ConnectedSocket() client: AuthenticatedSocket) {
    client.leave(roomId);
    console.log(`Client ${client.id} left room ${roomId}`);
    return { event: 'leftRoom', data: roomId };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { chatRoomId: string; content: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    const userId = client.data.user?.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    // Verify user is participant
    const chatRoom = await this.chatService.findChatRoomById(data.chatRoomId);
    if (!chatRoom || (chatRoom.buyerId !== userId && chatRoom.sellerId !== userId)) {
      return { error: 'Access denied' };
    }

    // Save message to DB
    const savedMessage = await this.chatService.saveMessage(data.chatRoomId, userId, data.content);

    // Broadcast to all clients in the room
    this.server.to(data.chatRoomId).emit('newMessage', savedMessage);

    return savedMessage;
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { chatRoomId: string }, @ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.data.user?.userId;
    if (!userId) return;

    client.to(data.chatRoomId).emit('userTyping', { userId });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(@MessageBody() data: { chatRoomId: string }, @ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.data.user?.userId;
    if (!userId) return;

    client.to(data.chatRoomId).emit('userStoppedTyping', { userId });
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(@MessageBody() data: { chatRoomId: string }, @ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.data.user?.userId;
    if (!userId) return;

    await this.chatService.markMessagesAsRead(data.chatRoomId, userId);

    // Notify other participants that messages were read
    client.to(data.chatRoomId).emit('messagesRead', {
      chatRoomId: data.chatRoomId,
      readBy: userId,
    });
  }

  // Check if a user is online
  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId) && this.onlineUsers.get(userId)!.size > 0;
  }
}
