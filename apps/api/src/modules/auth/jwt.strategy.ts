import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'
import { AppConfigService } from '../../core/config/config.service'
import { PrismaService } from '../../core/database/prisma.service'

function parseCookieFromHeader(cookieHeader: string | undefined, cookieName: string): string | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').map((c) => c.trim())
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=')
    if (name === cookieName && value) {
      return value
    }
  }
  return null
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: AppConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          if (req?.cookies?.access_token) {
            return req.cookies.access_token as string
          }

          const cookieHeader = req?.headers?.cookie
          return parseCookieFromHeader(cookieHeader, 'access_token')
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
    })
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { isBlocked: true },
    })
    if (!user || user.isBlocked) {
      throw new UnauthorizedException('차단된 계정입니다')
    }
    return { userId: payload.sub, email: payload.email }
  }
}
