import { Module } from '@nestjs/common'
import { PrismaModule } from '../../core/database/prisma.module'
import { StorageModule } from '../../core/storage/storage.module'
import { ChatModule } from '../../chat/chat.module'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'

@Module({
  imports: [PrismaModule, StorageModule, ChatModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
