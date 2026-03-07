import { Injectable } from '@nestjs/common'
import { ConfigService as NestConfigService } from '@nestjs/config'

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService) {}

  get nodeEnv(): 'development' | 'production' | 'test' {
    return this.configService.get<'development' | 'production' | 'test'>('NODE_ENV', 'development')
  }

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL', '')
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', '')
  }

  get googleClientId(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_ID', '')
  }

  get googleClientSecret(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_SECRET', '')
  }

  get googleCallbackUrl(): string {
    return this.configService.get<string>('GOOGLE_CALLBACK_URL', '')
  }

  get resendApiKey(): string {
    return this.configService.get<string>('RESEND_API_KEY', '')
  }

  get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL', '')
  }

  get supabaseUrl(): string {
    return this.configService.get<string>('SUPABASE_URL', '')
  }

  get supabaseServiceRoleKey(): string {
    return this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY', '')
  }

  get apiSecretKey(): string {
    return this.configService.get<string>('API_SECRET_KEY', '')
  }

  get cookieDomain(): string | undefined {
    const domain = this.configService.get<string>('COOKIE_DOMAIN', '').trim()
    return domain || undefined
  }

  get vapidPublicKey(): string | undefined {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') || undefined
  }

  get vapidPrivateKey(): string | undefined {
    return this.configService.get<string>('VAPID_PRIVATE_KEY') || undefined
  }
}
