import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AppConfigService } from '../../core/config/config.service';

function parseCookieFromHeader(cookieHeader: string | undefined, cookieName: string): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === cookieName && value) {
      return value;
    }
  }
  return null;
}

export type AuthenticatedSocket = Socket & {
  data: {
    user?: { userId: string; email: string };
  };
};

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: AppConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client: AuthenticatedSocket = context.switchToWs().getClient();
    const token = this.extractTokenFromHandshake(client);

    if (!token) {
      throw new WsException('Unauthorized: No token provided');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.jwtSecret,
      });
      client.data.user = { userId: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new WsException('Unauthorized: Invalid token');
    }
  }

  extractTokenFromHandshake(client: Socket): string | null {
    // Option 1: From handshake auth
    const authToken = client.handshake.auth?.token as string | undefined;
    if (authToken) return authToken;

    // Option 2: From cookies in handshake headers
    const cookieHeader = client.handshake.headers.cookie;
    if (cookieHeader) {
      return parseCookieFromHeader(cookieHeader, 'access_token');
    }

    return null;
  }
}
