import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { ChatGateway } from './chat.gateway'
import { PushModule } from '../modules/push/push.module'
import { UserBlocksModule } from '../modules/user-blocks/user-blocks.module'

@Module({
  imports: [PushModule, UserBlocksModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
