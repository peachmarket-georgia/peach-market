import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as webPush from 'web-push'
import { PrismaService } from '../../core/database/prisma.service'
import { AppConfigService } from '../../core/config/config.service'

type PushPayload = {
  title: string
  body: string
  url: string
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService
  ) {}

  onModuleInit() {
    const publicKey = this.config.vapidPublicKey
    const privateKey = this.config.vapidPrivateKey
    if (!publicKey || !privateKey) {
      this.logger.warn('VAPID keys not set — push notifications disabled')
      return
    }
    webPush.setVapidDetails('mailto:noreply@peachmarket.app', publicKey, privateKey)
    this.logger.log('Web Push initialized')
  }

  async subscribe(userId: string, endpoint: string, p256dh: string, auth: string) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh, auth },
      create: { userId, endpoint, p256dh, auth },
    })
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } })
  }

  async sendToUser(userId: string, payload: PushPayload) {
    if (!this.config.vapidPublicKey) return

    const subscriptions = await this.prisma.pushSubscription.findMany({ where: { userId } })

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload)
          )
        } catch (err: unknown) {
          if (typeof err === 'object' && err !== null && 'statusCode' in err) {
            const e = err as { statusCode: number }
            if (e.statusCode === 410 || e.statusCode === 404) {
              await this.prisma.pushSubscription.delete({ where: { id: sub.id } })
            }
          }
        }
      })
    )
  }

  getVapidPublicKey() {
    return this.config.vapidPublicKey ?? ''
  }
}
