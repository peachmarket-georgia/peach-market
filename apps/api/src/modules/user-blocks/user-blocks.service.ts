import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../core/database/prisma.service'

@Injectable()
export class UserBlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('자기 자신을 차단할 수 없습니다')
    }

    const target = await this.prisma.user.findUnique({ where: { id: blockedId } })
    if (!target) {
      throw new NotFoundException('사용자를 찾을 수 없습니다')
    }

    const existing = await this.prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    })
    if (existing) {
      throw new BadRequestException('이미 차단한 사용자입니다')
    }

    await this.prisma.userBlock.create({
      data: { blockerId, blockedId },
    })

    return { message: '사용자를 차단했습니다' }
  }

  async unblockUser(blockerId: string, blockedId: string) {
    const block = await this.prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    })
    if (!block) {
      throw new NotFoundException('차단 기록을 찾을 수 없습니다')
    }

    await this.prisma.userBlock.delete({ where: { id: block.id } })

    return { message: '차단이 해제되었습니다' }
  }

  async getBlockedUsers(blockerId: string) {
    return this.prisma.userBlock.findMany({
      where: { blockerId },
      select: {
        id: true,
        createdAt: true,
        blocked: { select: { id: true, nickname: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: { blockerId: true, blockedId: true },
    })

    const ids = new Set<string>()
    for (const b of blocks) {
      if (b.blockerId === userId) ids.add(b.blockedId)
      else ids.add(b.blockerId)
    }
    return [...ids]
  }

  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId1, blockedId: userId2 },
          { blockerId: userId2, blockedId: userId1 },
        ],
      },
    })
    return !!block
  }
}
