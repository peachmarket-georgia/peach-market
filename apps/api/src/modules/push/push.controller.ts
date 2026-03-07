import { Controller, Post, Delete, Get, Body, Req } from '@nestjs/common'
import { PushService } from './push.service'
import type { Request } from 'express'

type SubscribeDto = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.pushService.getVapidPublicKey() }
  }

  @Post('subscribe')
  async subscribe(@Body() body: SubscribeDto, @Req() req: Request) {
    const userId = (req.user as { userId: string }).userId
    await this.pushService.subscribe(userId, body.endpoint, body.keys.p256dh, body.keys.auth)
    return { message: 'subscribed' }
  }

  @Delete('unsubscribe')
  async unsubscribe(@Body() body: { endpoint: string }, @Req() req: Request) {
    const userId = (req.user as { userId: string }).userId
    await this.pushService.unsubscribe(userId, body.endpoint)
    return { message: 'unsubscribed' }
  }
}
