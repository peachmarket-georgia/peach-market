import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context)
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser | undefined {
    // 인증 실패해도 에러를 던지지 않고 undefined 반환
    if (err || !user) {
      return undefined
    }
    return user
  }
}
