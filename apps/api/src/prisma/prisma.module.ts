import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

/**
 * 🍑 Prisma 모듈
 *
 * @Global() 데코레이터로 앱 전체에서 PrismaService를 import 없이 사용 가능합니다.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
