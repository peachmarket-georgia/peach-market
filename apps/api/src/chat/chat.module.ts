import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { ChatRoomsRepository } from './chat-rooms.repository'
import { MessagesRepository } from './messages.repository'

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatRoomsRepository, MessagesRepository],
  exports: [ChatService, ChatRoomsRepository, MessagesRepository],
})
export class ChatModule {}
