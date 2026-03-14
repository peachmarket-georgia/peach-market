import { Module } from '@nestjs/common'
import { PrismaModule } from '../../core/database/prisma.module'
import { ChatModule } from '../../chat/chat.module'
import { ReservationsController } from './reservations.controller'
import { ReservationsService } from './reservations.service'

@Module({
  imports: [PrismaModule, ChatModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
