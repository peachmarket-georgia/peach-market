import { Injectable } from '@nestjs/common'
import { Prisma, Message } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { BaseRepository } from '../common/repositories/base.repository'

@Injectable()
export class MessagesRepository implements BaseRepository<
  Message,
  Prisma.MessageCreateInput,
  Prisma.MessageUpdateInput
> {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Message | null> {
    return this.prisma.message.findUnique({ where: { id } })
  }

  async findAll(): Promise<Message[]> {
    return this.prisma.message.findMany({
      orderBy: { createdAt: 'asc' },
    })
  }

  async findByChatRoomId(chatRoomId: string): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { chatRoomId },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  async create(data: Prisma.MessageCreateInput): Promise<Message> {
    return this.prisma.message.create({ data })
  }

  async update(id: string, data: Prisma.MessageUpdateInput): Promise<Message> {
    return this.prisma.message.update({ where: { id }, data })
  }

  async delete(id: string): Promise<Message> {
    return this.prisma.message.delete({ where: { id } })
  }

  async markAsRead(chatRoomId: string, userId: string): Promise<void> {
    await this.prisma.message.updateMany({
      where: {
        chatRoomId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    })
  }

  async countUnread(chatRoomId: string, userId: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        chatRoomId,
        senderId: { not: userId },
        isRead: false,
      },
    })
  }
}
