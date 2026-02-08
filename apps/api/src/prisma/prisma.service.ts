import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * 🍑 피치마켓 Prisma 서비스
 *
 * NestJS 앱 전체에서 공유되는 Prisma 클라이언트입니다.
 * 앱 시작 시 DB 연결, 종료 시 연결 해제를 자동으로 처리합니다.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = `${process.env.DATABASE_URL}`;
    console.log(
      `[PrismaService] Connecting to DB. URL defined: ${!!process.env.DATABASE_URL}, Length: ${connectionString.length}`,
    );
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
