'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IconLoader2, IconArrowLeft, IconCircleCheck, IconAlertCircle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/lib/api'
import { validateEmail } from '@/utils'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // 클라이언트 측 검증
    if (!validateEmail(email)) {
      setError('유효한 이메일을 입력해주세요.')
      return
    }

    setIsLoading(true)

    try {
      const { error: apiError } = await authApi.forgotPassword({ email })

      if (apiError) {
        setError(apiError)
        return
      }

      // 보안상 항상 성공 메시지 표시 (이메일 존재 여부 무관)
      setSuccess(true)
    } finally {
      setIsLoading(false)
    }
  }

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
              <h2 className="text-2xl font-bold">메일 발송 완료</h2>
              <p className="text-muted-foreground">
                <span className="font-medium">{email}</span>으로
                <br />
                비밀번호 재설정 링크를 발송했습니다.
              </p>
            </div>

            <div className="text-sm text-muted-foreground text-center space-y-1">
              <p>메일함을 확인해주세요.</p>
              <p className="text-xs">(스팸함도 확인해주세요)</p>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                <IconArrowLeft className="size-4 mr-2" />
                로그인으로 돌아가기
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
          >
            <IconArrowLeft className="size-4" />
            로그인으로 돌아가기
          </Link>
          <CardTitle className="text-2xl">비밀번호 찾기</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            가입하신 이메일 주소를 입력하면
            <br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 flex items-start gap-3">
              <IconAlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="size-4 mr-2 animate-spin" />
                  재설정 링크 발송 중...
                </>
              ) : (
                '재설정 링크 보내기'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
