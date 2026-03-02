import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { AppConfigService } from '../config/config.service'

export const SKIP_API_KEY = 'skipApiKey'
export const SkipApiKey = () => SetMetadata(SKIP_API_KEY, true)

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: AppConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const skipApiKey = this.reflector.getAllAndOverride<boolean>(SKIP_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (skipApiKey) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    const apiKey = request.headers['x-api-key']
    const expectedKey = this.configService.apiSecretKey

    if (!expectedKey) {
      return true
    }

    if (!apiKey || apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid API Key')
    }

    return true
  }
}
