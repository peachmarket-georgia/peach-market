import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
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

  async findChatRoomByIdWithMessages(id: string, userId?: string) {
    const room = await this.prisma.chatRoom.findUnique({
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

    if (!room) return null

    let leftByOther = false
    let currentUserLeft = false

    if (userId) {
      if (userId === room.buyerId) {
        leftByOther = room.sellerLeftAt !== null
        currentUserLeft = room.buyerLeftAt !== null
      } else if (userId === room.sellerId) {
        leftByOther = room.buyerLeftAt !== null
        currentUserLeft = room.sellerLeftAt !== null
      }
    }

    return { ...room, leftByOther, currentUserLeft }
  }

  async findChatRoomsByUserId(userId: string): Promise<ChatRoom[]> {
    return this.prisma.chatRoom.findMany({
      where: {
        OR: [
          { buyerId: userId, buyerLeftAt: null },
          { sellerId: userId, sellerLeftAt: null },
        ],
      },
      include: {
        buyer: true,
        seller: true,
        product: true,
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async leaveRoom(roomId: string, userId: string): Promise<{ otherUserId: string }> {
    const room = await this.prisma.chatRoom.findUnique({ where: { id: roomId } })

    if (!room) throw new NotFoundException('채팅방을 찾을 수 없습니다')

    const isBuyer = room.buyerId === userId
    const isSeller = room.sellerId === userId

    if (!isBuyer && !isSeller) {
      throw new ForbiddenException('채팅방에 접근할 권한이 없습니다')
    }

    if (isBuyer && room.buyerLeftAt !== null) {
      throw new BadRequestException('이미 채팅방을 나갔습니다')
    }
    if (isSeller && room.sellerLeftAt !== null) {
      throw new BadRequestException('이미 채팅방을 나갔습니다')
    }

    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: isBuyer ? { buyerLeftAt: new Date() } : { sellerLeftAt: new Date() },
    })

    const systemContent = JSON.stringify({ type: 'system', message: '상대방이 채팅방을 나갔습니다' })
    await this.saveSystemMessage(roomId, userId, systemContent)

    const otherUserId = isBuyer ? room.sellerId : room.buyerId
    return { otherUserId }
  }

  private async saveSystemMessage(chatRoomId: string, senderId: string, content: string) {
    const message = await this.prisma.message.create({
      data: { chatRoomId, senderId, content, isSystem: true },
      include: { sender: true },
    })

    await this.prisma.chatRoom.update({
      where: { id: chatRoomId },
      data: { lastMessage: content, updatedAt: new Date() },
    })

    return message
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

    if (product.isHidden) {
      throw new BadRequestException('숨겨진 상품에는 채팅을 시작할 수 없습니다')
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
        OR: [
          { buyerId: userId, buyerLeftAt: null },
          { sellerId: userId, sellerLeftAt: null },
        ],
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
