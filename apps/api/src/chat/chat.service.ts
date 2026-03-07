import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { ChatRoom, Message } from '@prisma/client'
import { PrismaService } from '../core/database/prisma.service'

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: { id: true, nickname: true } })
  }

  // ChatRoom 관련 메서드
  async findChatRoomById(id: string): Promise<ChatRoom | null> {
    return this.prisma.chatRoom.findUnique({ where: { id } })
  }

  async findChatRoomByIdWithMessages(id: string) {
    return this.prisma.chatRoom.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: true },
        },
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

  async findChatRoomByProductAndBuyer(productId: string, buyerId: string): Promise<ChatRoom | null> {
    return this.prisma.chatRoom.findUnique({
      where: {
        productId_buyerId: { productId, buyerId },
      },
    })
  }

  async createChatRoom(productId: string, buyerId: string) {
    // Find product and get seller
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다')
    }

    if (product.sellerId === buyerId) {
      throw new BadRequestException('자신의 상품에는 채팅을 시작할 수 없습니다')
    }

    // Check if chat room already exists
    const existingRoom = await this.findChatRoomByProductAndBuyer(productId, buyerId)
    if (existingRoom) {
      return this.prisma.chatRoom.findUnique({
        where: { id: existingRoom.id },
        include: {
          product: true,
          buyer: true,
          seller: true,
        },
      })
    }

    // Create new chat room
    return this.prisma.chatRoom.create({
      data: {
        productId,
        buyerId,
        sellerId: product.sellerId,
      },
      include: {
        product: true,
        buyer: true,
        seller: true,
      },
    })
  }

  async getChatRoomsWithUnreadCount(userId: string) {
    const chatRooms = await this.findChatRoomsByUserId(userId)

    const roomsWithUnread = await Promise.all(
      chatRooms.map(async (room) => {
        const unreadCount = await this.countUnreadMessages(room.id, userId)
        return { ...room, unreadCount }
      })
    )

    return roomsWithUnread
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    const chatRooms = await this.prisma.chatRoom.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      select: { id: true },
    })

    let total = 0
    for (const room of chatRooms) {
      total += await this.countUnreadMessages(room.id, userId)
    }
    return total
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

  async countUnreadMessages(chatRoomId: string, userId: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        chatRoomId,
        senderId: { not: userId },
        isRead: false,
      },
    })
  }

  async saveMessage(chatRoomId: string, senderId: string, content: string): Promise<Message> {
    // Save message
    const message = await this.prisma.message.create({
      data: {
        chatRoomId,
        senderId,
        content,
      },
      include: {
        sender: true,
      },
    })

    // Update lastMessage in ChatRoom
    await this.prisma.chatRoom.update({
      where: { id: chatRoomId },
      data: {
        lastMessage: content,
        updatedAt: new Date(),
      },
    })

    return message
  }
}
