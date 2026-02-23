import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'
import { AppConfigService } from '../../core/config/config.service'

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
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          if (req?.cookies?.refresh_token) {
            return req.cookies.refresh_token as string
          }

          const cookieHeader = req?.headers?.cookie
          return parseCookieFromHeader(cookieHeader, 'refresh_token')
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
      passReqToCallback: true,
    })
  }

  validate(req: Request, payload: { sub: string; email: string }) {
    // Try cookie-parser first, then fallback to raw header
    let refreshToken = req.cookies?.refresh_token as string
    if (!refreshToken) {
      const cookieHeader = req?.headers?.cookie
      refreshToken = parseCookieFromHeader(cookieHeader, 'refresh_token') || ''
    }

    return {
      userId: payload.sub,
      email: payload.email,
      refreshToken,
    }
  }
}
