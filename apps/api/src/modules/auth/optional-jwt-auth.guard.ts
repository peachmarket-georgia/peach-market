import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context)
    } catch {
      // 토큰 없거나 유효하지 않아도 요청 통과
    }
    return true
  }

  handleRequest<TUser>(_err: Error | null, user: TUser): TUser | undefined {
    return user || undefined
  }
}
