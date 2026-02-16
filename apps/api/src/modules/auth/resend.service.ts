import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { AppConfigService } from '../../core/config/config.service';

@Injectable()
export class ResendService {
  private resend: Resend;
  private readonly logger = new Logger(ResendService.name);
  private readonly fromEmail: string = 'yourname@resend.dev';

  constructor(private configService: AppConfigService) {
    const apiKey = this.configService.resendApiKey;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY not configured. Email sending will be skipped.');
    }

    if (configService.nodeEnv === 'production') {
      this.fromEmail = 'peachmarket215@gmail.com';
    }
  }

  async sendVerificationEmail(email: string, verificationToken: string) {
    const frontendUrl = this.configService.frontendUrl;

    const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    if (!this.resend) {
      this.logger.log(`[DEV] 이메일 인증 링크: ${verifyUrl}`);
      this.logger.log(`[DEV] 수신자: ${email}`);
      return;
    }

    try {
      const res = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: '[피치마켓] 이메일 인증을 완료해주세요',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF6B35;">피치마켓 가입을 환영합니다!</h2>
            <p>안녕하세요,</p>
            <p>회원가입을 완료하려면 아래 버튼을 클릭하여 이메일 주소를 인증해주세요.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                이메일 인증하기
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">이 링크는 24시간 동안 유효합니다.</p>
            <p style="color: #666; font-size: 14px;">본인이 가입하지 않은 경우 이 이메일을 무시하세요.</p>
            <br>
            <p style="color: #999; font-size: 12px;">감사합니다,<br>피치마켓 팀</p>
          </div>
        `,
      });

      if (res.error) {
        throw res.error.message;
      }

      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const frontendUrl = this.configService.frontendUrl;

    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    if (!this.resend) {
      this.logger.log(`[DEV] 비밀번호 재설정 링크: ${resetUrl}`);
      this.logger.log(`[DEV] 수신자: ${email}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: '[피치마켓] 비밀번호 재설정 안내',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF6B35;">비밀번호 재설정</h2>
            <p>안녕하세요,</p>
            <p>피치마켓 비밀번호 재설정 링크입니다. 아래 버튼을 클릭하여 비밀번호를 재설정하세요.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                비밀번호 재설정하기
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">이 링크는 1시간 동안 유효합니다.</p>
            <p style="color: #666; font-size: 14px;">본인이 요청하지 않은 경우 이 이메일을 무시하세요.</p>
            <br>
            <p style="color: #999; font-size: 12px;">감사합니다,<br>피치마켓 팀</p>
          </div>
        `,
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
