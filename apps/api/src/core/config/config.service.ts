import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService) {}

  get nodeEnv(): 'development' | 'production' | 'test' {
    return this.configService.get<'development' | 'production' | 'test'>('NODE_ENV', 'development');
  }

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL', '');
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', 'fallback-jwt-secret-change-in-production');
  }

  get googleClientId(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_ID', '');
  }

  get googleClientSecret(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_SECRET', '');
  }

  get resendApiKey(): string {
    return this.configService.get<string>('RESEND_API_KEY', '');
  }
}
