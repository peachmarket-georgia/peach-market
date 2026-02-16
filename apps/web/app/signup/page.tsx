'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { IconEye, IconEyeOff, IconLoader2, IconBrandGoogle, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { authApi, userApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { validateEmail, validateNickname, validatePassword } from '@/utils';
import { GEORGIA_LOCATIONS } from '@/constants';

type PasswordStrength = 'weak' | 'medium' | 'strong';

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [nickname, setNickname] = useState('');
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(false);
  const [checkingNickname, setCheckingNickname] = useState(false);

  const [location, setLocation] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrength = getPasswordStrength(password);
  const passwordMatch = password && passwordConfirm && password === passwordConfirm;

  const handleCheckEmail = async () => {
    if (!validateEmail(email)) {
      setError('유효한 이메일을 입력해주세요.');
      return;
    }

    setCheckingEmail(true);
    setError(null);

    try {
      const { data, error: apiError } = await userApi.checkEmail(email);

      if (apiError) {
        setError(apiError);
        return;
      }

      if (data) {
        setEmailChecked(true);
        setEmailAvailable(data.available);
        if (!data.available) {
          setError('이미 사용 중인 이메일입니다.');
        }
      }
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleCheckNickname = async () => {
    if (!validateNickname(nickname)) {
      setError('닉네임은 2-20자 사이여야 합니다.');
      return;
    }

    setCheckingNickname(true);
    setError(null);

    try {
      const { data, error: apiError } = await userApi.checkNickname(nickname);

      if (apiError) {
        setError(apiError);
        return;
      }

      if (data) {
        setNicknameChecked(true);
        setNicknameAvailable(data.available);
        if (!data.available) {
          setError('이미 사용 중인 닉네임입니다.');
        }
      }
    } finally {
      setCheckingNickname(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // 클라이언트 측 검증
    if (!emailChecked || !emailAvailable) {
      setError('이메일 중복 확인이 필요합니다.');
      return;
    }

    if (!validatePassword(password)) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    if (!passwordMatch) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!nicknameChecked || !nicknameAvailable) {
      setError('닉네임 중복 확인이 필요합니다.');
      return;
    }

    if (!location) {
      setError('거주 지역을 선택해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: apiError } = await authApi.signup({
        email,
        password,
        nickname,
        location,
      });

      if (apiError) {
        setError(apiError);
        return;
      }

      if (data) {
        // 회원가입 성공 → 이메일 인증 페이지로 이동
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* 로고 */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Image src="/peach_logo_transparent.png" alt="피치마켓" width={40} height={40} className="w-10 h-10" />
        <span className="text-xl font-bold text-primary">피치마켓</span>
      </Link>

      {/* 카드 */}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">회원가입</CardTitle>
          <p className="text-sm text-muted-foreground text-center mt-2">조지아 한인 중고거래</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google 회원가입 */}
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={isLoading}>
            <IconBrandGoogle className="size-5 mr-2" />
            Google로 시작하기
          </Button>

          {/* 구분선 */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              또는
            </span>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 flex items-start gap-3">
              <IconAlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* 회원가입 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 */}
            <div className="space-y-2">
              <Label htmlFor="email">
                이메일 <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailChecked(false);
                  }}
                  placeholder="example@email.com"
                  autoComplete="email"
                  inputMode="email"
                  disabled={isLoading}
                  className={cn(
                    emailChecked && emailAvailable && 'border-success',
                    emailChecked && !emailAvailable && 'border-destructive'
                  )}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckEmail}
                  disabled={isLoading || checkingEmail || !email}
                  className="shrink-0"
                >
                  {checkingEmail ? <IconLoader2 className="size-4 animate-spin" /> : '중복확인'}
                </Button>
              </div>
              {emailChecked && emailAvailable && (
                <p className="text-sm text-success flex items-center gap-1">
                  <IconCheck className="size-4" />
                  사용 가능한 이메일입니다
                </p>
              )}
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <Label htmlFor="password">
                비밀번호 <span className="text-destructive">*</span>{' '}
                <span className="text-xs text-muted-foreground">(최소 8자)</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
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
                  <IconCheck className="size-4" />
                  비밀번호가 일치합니다
                </p>
              )}
              {passwordConfirm && !passwordMatch && (
                <p className="text-sm text-destructive">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            {/* 닉네임 */}
            <div className="space-y-2">
              <Label htmlFor="nickname">
                닉네임 <span className="text-destructive">*</span>{' '}
                <span className="text-xs text-muted-foreground">(2-20자)</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setNicknameChecked(false);
                  }}
                  placeholder="닉네임을 입력하세요"
                  autoComplete="username"
                  disabled={isLoading}
                  maxLength={20}
                  className={cn(
                    nicknameChecked && nicknameAvailable && 'border-success',
                    nicknameChecked && !nicknameAvailable && 'border-destructive'
                  )}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckNickname}
                  disabled={isLoading || checkingNickname || !nickname}
                  className="shrink-0"
                >
                  {checkingNickname ? <IconLoader2 className="size-4 animate-spin" /> : '중복확인'}
                </Button>
              </div>
              {nicknameChecked && nicknameAvailable && (
                <p className="text-sm text-success flex items-center gap-1">
                  <IconCheck className="size-4" />
                  사용 가능한 닉네임입니다
                </p>
              )}
            </div>

            {/* 거주 지역 */}
            <div className="space-y-2">
              <Label htmlFor="location">
                거주 지역 <span className="text-destructive">*</span>{' '}
                <span className="text-xs text-muted-foreground">(조지아)</span>
              </Label>
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">지역을 선택해주세요</option>
                {GEORGIA_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* 회원가입 버튼 */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="size-4 mr-2 animate-spin" />
                  회원가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 로그인 링크 */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          로그인
        </Link>
      </p>
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
