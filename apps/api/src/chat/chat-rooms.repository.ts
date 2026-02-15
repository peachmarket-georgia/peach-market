import { Injectable } from '@nestjs/common'
import { Prisma, ChatRoom } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { BaseRepository } from '../common/repositories/base.repository'

@Injectable()
export class ChatRoomsRepository implements BaseRepository<
  ChatRoom,
  Prisma.ChatRoomCreateInput,
  Prisma.ChatRoomUpdateInput
> {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ChatRoom | null> {
    return this.prisma.chatRoom.findUnique({ where: { id } })
  }

  async findByIdWithMessages(id: string) {
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

  async findAll(): Promise<ChatRoom[]> {
    return this.prisma.chatRoom.findMany({
      orderBy: { updatedAt: 'desc' },
    })
  }

  async findByUserId(userId: string): Promise<ChatRoom[]> {
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

  async findByProductAndBuyer(
    productId: string,
    buyerId: string
  ): Promise<ChatRoom | null> {
    return this.prisma.chatRoom.findUnique({
      where: {
        productId_buyerId: { productId, buyerId },
      },
    })
  }

  async create(data: Prisma.ChatRoomCreateInput): Promise<ChatRoom> {
    return this.prisma.chatRoom.create({ data })
  }

  async update(
    id: string,
    data: Prisma.ChatRoomUpdateInput
  ): Promise<ChatRoom> {
    return this.prisma.chatRoom.update({ where: { id }, data })
  }

  async delete(id: string): Promise<ChatRoom> {
    return this.prisma.chatRoom.delete({ where: { id } })
  }

  async updateLastMessage(id: string, lastMessage: string): Promise<ChatRoom> {
    return this.prisma.chatRoom.update({
      where: { id },
      data: { lastMessage },
    })
  }
}
