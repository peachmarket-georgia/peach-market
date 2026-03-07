import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../core/database/prisma.service'

@Injectable()
export class AdminRoleGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user?.userId) {
      throw new ForbiddenException('인증이 필요합니다')
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
      throw new ForbiddenException('관리자 권한이 필요합니다')
    }

    return true
  }
}
