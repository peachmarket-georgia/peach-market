import { Injectable } from '@nestjs/common'
import { ChatRoom, Message } from '@prisma/client'
import { ChatRoomsRepository } from './chat-rooms.repository'
import { MessagesRepository } from './messages.repository'

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRoomsRepository: ChatRoomsRepository,
    private readonly messagesRepository: MessagesRepository
  ) {}

  // ChatRoom 관련 메서드
  async findChatRoomById(id: string): Promise<ChatRoom | null> {
    return this.chatRoomsRepository.findById(id)
  }

  async findChatRoomByIdWithMessages(id: string) {
    return this.chatRoomsRepository.findByIdWithMessages(id)
  }

  async findChatRoomsByUserId(userId: string): Promise<ChatRoom[]> {
    return this.chatRoomsRepository.findByUserId(userId)
  }

  async findChatRoomByProductAndBuyer(
    productId: string,
    buyerId: string
  ): Promise<ChatRoom | null> {
    return this.chatRoomsRepository.findByProductAndBuyer(productId, buyerId)
  }

  // Message 관련 메서드
  async findMessagesByChatRoomId(chatRoomId: string): Promise<Message[]> {
    return this.messagesRepository.findByChatRoomId(chatRoomId)
  }

  async markMessagesAsRead(chatRoomId: string, userId: string): Promise<void> {
    return this.messagesRepository.markAsRead(chatRoomId, userId)
  }

  async countUnreadMessages(
    chatRoomId: string,
    userId: string
  ): Promise<number> {
    return this.messagesRepository.countUnread(chatRoomId, userId)
  }
}
