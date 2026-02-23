import { Module } from '@nestjs/common'
import { PrismaModule } from '../../core/database/prisma.module'
import { UploadModule } from '../upload/upload.module'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
