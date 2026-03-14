'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconBrandGoogle,
  IconAlertCircle,
  IconUserPlus,
  IconLogin2,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { authApi } from '@/lib/api'
import { validateEmail } from '@/utils'

export function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/marketplace'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // 클라이언트 측 검증
    if (!validateEmail(email)) {
      setError('유효한 이메일을 입력해주세요.')
      return
    }

    if (!password) {
      setError('비밀번호를 입력해주세요.')
      return
    }

    setIsLoading(true)

    try {
      const { data, error: apiError } = await authApi.login({ email, password })

      if (apiError) {
        setError(apiError)
        return
      }

      if (data) {
        // 로그인 성공 → 지정된 경로로 이동
        router.push(redirectTo)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`
  }

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
          <CardTitle className="text-2xl text-center">로그인</CardTitle>
          <p className="text-sm text-muted-foreground text-center mt-2">조지아 한인 중고거래</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 회원가입 유도 배너 */}
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
            <p className="text-base font-bold text-foreground mb-1">처음이신가요?</p>
            <p className="text-sm text-muted-foreground mb-3">회원가입을 먼저 해주세요</p>
            <Link href="/signup">
              <Button className="w-full font-bold">
                <IconUserPlus className="size-4 mr-2" />
                회원가입 바로가기
              </Button>
            </Link>
          </div>

          {/* 이미 계정이 있는 경우 - 로그인 폼 토글 */}
          {!showForm ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">이미 계정이 있으신가요?</p>
              <Button variant="outline" className="w-full font-semibold" onClick={() => setShowForm(true)}>
                <IconLogin2 className="size-4 mr-2" />
                이메일로 로그인하기
              </Button>
            </div>
          ) : (
            <>
              {/* 에러 메시지 */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 flex items-start gap-3">
                  <IconAlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* 로그인 폼 */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 이메일 */}
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    autoComplete="email"
                    inputMode="email"
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* 비밀번호 */}
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      autoComplete="current-password"
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
                </div>

                {/* 비밀번호 찾기 링크 */}
                <div className="text-right">
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>

                {/* 로그인 버튼 */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <IconLoader2 className="size-4 mr-2 animate-spin" />
                      로그인 중...
                    </>
                  ) : (
                    '로그인'
                  )}
                </Button>
              </form>
            </>
          )}

          {/* 구분선 */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              또는
            </span>
          </div>

          {/* Google 로그인 */}
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
            <IconBrandGoogle className="size-5 mr-2" />
            Google로 계속하기
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
