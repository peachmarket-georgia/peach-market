import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { ChatGateway } from './chat.gateway'
import { PushModule } from '../modules/push/push.module'

@Module({
  imports: [PushModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
