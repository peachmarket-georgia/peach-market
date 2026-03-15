import { Module } from '@nestjs/common'
import { PrismaModule } from '../../core/database/prisma.module'
import { UserBlocksController } from './user-blocks.controller'
import { UserBlocksService } from './user-blocks.service'

@Module({
  imports: [PrismaModule],
  controllers: [UserBlocksController],
  providers: [UserBlocksService],
  exports: [UserBlocksService],
})
export class UserBlocksModule {}
