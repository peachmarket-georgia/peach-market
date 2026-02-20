import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export type JwtUser = {
  userId: string;
  email: string;
};

export type JwtRefreshUser = JwtUser & { refreshToken: string };

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.user;
});
