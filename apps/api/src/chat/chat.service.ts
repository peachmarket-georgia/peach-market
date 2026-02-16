import { Injectable } from '@nestjs/common'
import { ChatRoom, Message } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // ChatRoom 관련 메서드
  async findChatRoomById(id: string): Promise<ChatRoom | null> {
    return this.prisma.chatRoom.findUnique({ where: { id } })
  }

  async findChatRoomByIdWithMessages(id: string) {
    return this.prisma.chatRoom.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        buyer: true,
        seller: true,
        product: true,
      },
    })
  }

  async findChatRoomsByUserId(userId: string): Promise<ChatRoom[]> {
    return this.prisma.chatRoom.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        buyer: true,
        seller: true,
        product: true,
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async findChatRoomByProductAndBuyer(
    productId: string,
    buyerId: string
  ): Promise<ChatRoom | null> {
    return this.prisma.chatRoom.findUnique({
      where: {
        productId_buyerId: { productId, buyerId },
      },
    })
  }

  // Message 관련 메서드
  async findMessagesByChatRoomId(chatRoomId: string): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { chatRoomId },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  async markMessagesAsRead(chatRoomId: string, userId: string): Promise<void> {
    await this.prisma.message.updateMany({
      where: {
        chatRoomId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    })
  }

  async countUnreadMessages(
    chatRoomId: string,
    userId: string
  ): Promise<number> {
    return this.prisma.message.count({
      where: {
        chatRoomId,
        senderId: { not: userId },
        isRead: false,
      },
    })
  }

  async saveMessage(
    chatRoomId: string,
    senderId: string,
    content: string
  ): Promise<Message> {
    return this.prisma.message.create({
      data: {
        chatRoomId,
        senderId,
        content,
      },
      include: {
        sender: true,
      },
    })
  }
}
