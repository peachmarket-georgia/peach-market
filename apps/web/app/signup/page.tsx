'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconBrandGoogle,
  IconAlertCircle,
  IconCheck,
  IconMail,
  IconArrowRight,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StepIndicator } from '@/components/ui/step-indicator'
import { ProfileSetupForm } from '@/components/auth/profile-setup-form'
import { authApi, userApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { validateEmail, validatePassword } from '@/utils'
import { useDebouncedCheck } from '@/hooks/use-debounced-check'

type PasswordStrength = 'weak' | 'medium' | 'strong'

const STEPS = [
  { label: '시작하기' },
  { label: '계정 정보' },
  { label: '프로필 설정' },
]

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  // Step 1: 이메일 + 비밀번호
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 이메일 자동 중복 체크
  const checkEmail = useCallback((value: string) => userApi.checkEmail(value), [])
  const {
    isChecking: checkingEmail,
    isAvailable: emailAvailable,
    error: emailError,
    check: triggerEmailCheck,
    reset: resetEmailCheck,
  } = useDebouncedCheck(checkEmail, validateEmail, '올바른 이메일 형식으로 입력해주세요')

  const passwordStrength = getPasswordStrength(password)
  const passwordMatch = password && passwordConfirm && password === passwordConfirm

  const handleGoogleSignup = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    resetEmailCheck()
  }

  const handleEmailBlur = () => {
    if (email) {
      triggerEmailCheck(email)
    }
  }

  const handlePasswordBlur = () => {
    if (password && !validatePassword(password)) {
      setPasswordError('비밀번호는 최소 8자 이상이어야 합니다')
    } else {
      setPasswordError(null)
    }
  }

  const handleConfirmBlur = () => {
    if (passwordConfirm && !passwordMatch) {
      setConfirmError('비밀번호가 일치하지 않습니다')
    } else {
      setConfirmError(null)
    }
  }

  const handleNextToProfile = () => {
    setError(null)

    // 이메일 체크
    if (!email || emailAvailable !== true) {
      setError('이메일을 입력하고 사용 가능 여부를 확인해주세요')
      return
    }

    // 비밀번호 체크
    if (!validatePassword(password)) {
      setPasswordError('비밀번호는 최소 8자 이상이어야 합니다')
      return
    }

    if (!passwordMatch) {
      setConfirmError('비밀번호가 일치하지 않습니다')
      return
    }

    setStep(2)
  }

  const handleProfileSubmit = async (data: { nickname: string; location: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: apiError } = await authApi.signup({
        email,
        password,
        nickname: data.nickname,
        location: data.location,
      })

      if (apiError) {
        setError(apiError)
        return
      }

      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* 로고 */}
      <Link href="/" className="flex items-center gap-2 mb-6">
        <Image src="/peach_logo_transparent.png" alt="피치마켓" width={40} height={40} className="w-10 h-10" />
        <span className="text-xl font-bold text-primary">피치마켓</span>
      </Link>

      {/* 카드 */}
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 space-y-6">
          {/* 스텝 인디케이터 (Step 0 제외) */}
          {step > 0 && <StepIndicator steps={STEPS.slice(1)} currentStep={step - 1} />}

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 flex items-start gap-3">
              <IconAlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* ========== Step 0: 시작하기 ========== */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">회원가입</h1>
                <p className="text-muted-foreground">조지아 한인 중고거래 플랫폼</p>
              </div>

              {/* Google 회원가입 */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base"
                onClick={handleGoogleSignup}
              >
                <IconBrandGoogle className="size-5 mr-2" />
                Google로 시작하기
              </Button>

              {/* 구분선 */}
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                  또는
                </span>
              </div>

              {/* 이메일로 시작 */}
              <Button
                type="button"
                className="w-full h-12 text-base font-medium"
                onClick={() => setStep(1)}
              >
                <IconMail className="size-5 mr-2" />
                이메일로 시작하기
              </Button>
            </div>
          )}

          {/* ========== Step 1: 이메일 + 비밀번호 ========== */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold">계정 정보 입력</h2>
                <p className="text-sm text-muted-foreground">로그인에 사용할 이메일과 비밀번호를 입력해주세요</p>
              </div>

              {/* 이메일 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">
                  이메일 <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={handleEmailBlur}
                    placeholder="example@email.com"
                    autoComplete="email"
                    inputMode="email"
                    className={cn(
                      'h-12 text-base',
                      emailAvailable === true && 'border-success',
                      (emailAvailable === false || emailError) && 'border-destructive'
                    )}
                    required
                  />
                  {checkingEmail && (
                    <IconLoader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-5 animate-spin text-muted-foreground" />
                  )}
                </div>
                {emailAvailable === true && (
                  <p className="text-sm text-success flex items-center gap-1">
                    <IconCheck className="size-4" />
                    사용 가능한 이메일입니다
                  </p>
                )}
                {emailError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <IconAlertCircle className="size-4" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium">
                  비밀번호 <span className="text-destructive">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">8자 이상 입력해주세요</p>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setPasswordError(null)
                    }}
                    onBlur={handlePasswordBlur}
                    placeholder="비밀번호를 입력하세요"
                    autoComplete="new-password"
                    className={cn('h-12 text-base pr-12', passwordError && 'border-destructive')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPassword ? <IconEyeOff className="size-5" /> : <IconEye className="size-5" />}
                  </button>
                </div>
                {password && <PasswordStrengthIndicator level={passwordStrength} />}
                {passwordError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <IconAlertCircle className="size-4" />
                    {passwordError}
                  </p>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="text-base font-medium">
                  비밀번호 확인 <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="passwordConfirm"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => {
                      setPasswordConfirm(e.target.value)
                      setConfirmError(null)
                    }}
                    onBlur={handleConfirmBlur}
                    placeholder="비밀번호를 다시 입력하세요"
                    autoComplete="new-password"
                    className={cn(
                      'h-12 text-base pr-12',
                      passwordConfirm && passwordMatch && 'border-success',
                      confirmError && 'border-destructive'
                    )}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    aria-label={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPasswordConfirm ? <IconEyeOff className="size-5" /> : <IconEye className="size-5" />}
                  </button>
                </div>
                {passwordConfirm && passwordMatch && (
                  <p className="text-sm text-success flex items-center gap-1">
                    <IconCheck className="size-4" />
                    비밀번호가 일치합니다
                  </p>
                )}
                {confirmError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <IconAlertCircle className="size-4" />
                    {confirmError}
                  </p>
                )}
              </div>

              {/* 다음 버튼 */}
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  type="button"
                  className="w-full h-12 text-base font-medium"
                  onClick={handleNextToProfile}
                >
                  다음으로
                  <IconArrowRight className="size-5 ml-2" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-12 text-base"
                  onClick={() => setStep(0)}
                >
                  이전으로
                </Button>
              </div>
            </div>
          )}

          {/* ========== Step 2: 프로필 설정 ========== */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold">프로필 설정</h2>
                <p className="text-sm text-muted-foreground">다른 사용자에게 보여질 정보를 설정해주세요</p>
              </div>

              <ProfileSetupForm
                onSubmit={handleProfileSubmit}
                submitLabel="회원가입 완료"
                onBack={() => setStep(1)}
                isLoading={isLoading}
              />
            </div>
          )}
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
  )
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak'

  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++

  if (strength <= 2) return 'weak'
  if (strength <= 3) return 'medium'
  return 'strong'
}

function PasswordStrengthIndicator({ level }: { level: PasswordStrength }) {
  const config = {
    weak: { color: 'bg-destructive', width: '33%', text: '약함' },
    medium: { color: 'bg-warning', width: '66%', text: '보통' },
    strong: { color: 'bg-success', width: '100%', text: '강함' },
  }

  const current = config[level]

  return (
    <div className="space-y-1">
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full transition-all', current.color)} style={{ width: current.width }} />
      </div>
      <p className="text-sm text-muted-foreground">비밀번호 강도: {current.text}</p>
    </div>
  )
}
