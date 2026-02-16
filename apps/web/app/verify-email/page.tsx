'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { IconLoader2, IconMail } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { authApi } from '@/lib/api';

export default function VerifyEmailInfoPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResendEmail = async () => {
    if (!email) {
      setError('이메일 주소를 찾을 수 없습니다.');
      return;
    }

    setResendLoading(true);
    setError(null);
    setResendSuccess(false);

    try {
      const { data, error: apiError } = await authApi.resendVerification({ email });

      if (apiError) {
        setError(apiError);
        return;
      }

      if (data) {
        setResendSuccess(true);
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Image src="/peach_logo_transparent.png" alt="피치마켓" width={40} height={40} className="w-10 h-10" />
        <span className="text-xl font-bold text-primary">피치마켓</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardContent className="py-12 flex flex-col items-center gap-6">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
            <IconMail className="size-10 text-primary" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">이메일 인증이 필요합니다</h2>
            {email && (
              <p className="text-muted-foreground">
                <span className="font-medium">{email}</span>으로
                <br />
                인증 메일을 발송했습니다.
              </p>
            )}
            {!email && (
              <p className="text-muted-foreground">
                가입하신 이메일로
                <br />
                인증 메일을 발송했습니다.
              </p>
            )}
          </div>

          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p>메일함을 확인하고 인증 링크를 클릭해주세요.</p>
            <p className="text-xs">(스팸함도 확인해주세요)</p>
          </div>

          {/* 성공 메시지 */}
          {resendSuccess && (
            <div className="bg-success/10 border border-success/50 rounded-lg p-3 w-full">
              <p className="text-sm text-success text-center">인증 메일을 다시 발송했습니다.</p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 w-full">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 w-full">
            {email && (
              <Button onClick={handleResendEmail} variant="outline" disabled={resendLoading} className="w-full">
                {resendLoading ? (
                  <>
                    <IconLoader2 className="size-4 mr-2 animate-spin" />
                    재발송 중...
                  </>
                ) : (
                  '이메일 재발송'
                )}
              </Button>
            )}

            <p className="text-center text-sm text-muted-foreground">
              인증 완료 후{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                로그인하기
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
