'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { IconEye, IconEyeOff, IconLoader2, IconCircleCheck, IconAlertCircle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { validatePassword } from '@/utils';

type PasswordStrength = 'weak' | 'medium' | 'strong';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const passwordStrength = getPasswordStrength(password);
  const passwordMatch = password && passwordConfirm && password === passwordConfirm;

  // 토큰 유효성 간단 체크
  useEffect(() => {
    if (!token || token.length < 20) {
      setError('유효하지 않은 링크입니다.');
    }
  }, [token]);

  // 성공 시 카운트다운 및 리다이렉트
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (success && countdown === 0) {
      router.push('/login');
    }
  }, [success, countdown, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // 클라이언트 측 검증
    if (!validatePassword(password)) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    if (!passwordMatch) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: apiError } = await authApi.resetPassword(token, { newPassword: password });

      if (apiError) {
        setError(apiError);
        return;
      }

      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 성공 화면
  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <Image src="/peach_logo_transparent.png" alt="피치마켓" width={40} height={40} className="w-10 h-10" />
          <span className="text-xl font-bold text-primary">피치마켓</span>
        </Link>

        <Card className="w-full max-w-md">
          <CardContent className="py-12 flex flex-col items-center gap-6">
            <div className="size-16 rounded-full bg-success/10 flex items-center justify-center">
              <IconCircleCheck className="size-10 text-success" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">비밀번호 재설정 완료!</h2>
              <p className="text-muted-foreground">새로운 비밀번호로 로그인할 수 있습니다.</p>
            </div>

            <p className="text-sm text-muted-foreground">{countdown}초 후 로그인 페이지로 이동합니다...</p>

            <Button asChild className="w-full">
              <Link href="/login">지금 로그인하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 입력 화면
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Image src="/peach_logo_transparent.png" alt="피치마켓" width={40} height={40} className="w-10 h-10" />
        <span className="text-xl font-bold text-primary">피치마켓</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">비밀번호 재설정</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">새로운 비밀번호를 입력해주세요.</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 flex items-start gap-3">
              <IconAlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-destructive font-medium">{error}</p>
                {error.includes('유효하지 않은') || error.includes('만료된') ? (
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline inline-block">
                    다시 비밀번호 찾기
                  </Link>
                ) : null}
              </div>
            </div>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 새 비밀번호 */}
            <div className="space-y-2">
              <Label htmlFor="password">
                새 비밀번호 <span className="text-destructive">*</span>{' '}
                <span className="text-xs text-muted-foreground">(최소 8자)</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="새 비밀번호를 입력하세요"
                  autoComplete="new-password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                </button>
              </div>
              {password && <PasswordStrengthIndicator level={passwordStrength} />}
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">
                비밀번호 확인 <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="passwordConfirm"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  autoComplete="new-password"
                  disabled={isLoading}
                  className={cn(
                    passwordConfirm && passwordMatch && 'border-success',
                    passwordConfirm && !passwordMatch && 'border-destructive'
                  )}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPasswordConfirm ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                </button>
              </div>
              {passwordConfirm && passwordMatch && (
                <p className="text-sm text-success flex items-center gap-1">
                  <IconCircleCheck className="size-4" />
                  비밀번호가 일치합니다
                </p>
              )}
              {passwordConfirm && !passwordMatch && (
                <p className="text-sm text-destructive">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="size-4 mr-2 animate-spin" />
                  비밀번호 재설정 중...
                </>
              ) : (
                '비밀번호 재설정'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// 비밀번호 강도 계산
function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak';

  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

  if (strength <= 2) return 'weak';
  if (strength <= 3) return 'medium';
  return 'strong';
}

// 비밀번호 강도 표시
function PasswordStrengthIndicator({ level }: { level: PasswordStrength }) {
  const config = {
    weak: { color: 'bg-destructive', width: '33%', text: '약함' },
    medium: { color: 'bg-warning', width: '66%', text: '보통' },
    strong: { color: 'bg-success', width: '100%', text: '강함' },
  };

  const current = config[level];

  return (
    <div className="space-y-1">
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full transition-all', current.color)} style={{ width: current.width }} />
      </div>
      <p className="text-xs text-muted-foreground">비밀번호 강도: {current.text}</p>
    </div>
  );
}
