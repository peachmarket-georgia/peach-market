'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { IconLoader2, IconCircleCheck, IconAlertCircle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/lib/api'

export default function VerifyEmailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string | undefined
  const email = searchParams.get('email')

  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    if (token) {
      verifyEmailToken(token)
    }
  }, [token])

  // 토큰이 없으면 안내 페이지로 리다이렉트 (이론상 발생하지 않음)
  if (!token) {
    if (typeof window !== 'undefined') {
      window.location.href = '/verify-email'
    }
    return null
  }

  const verifyEmailToken = async (token: string) => {
    setIsVerifying(true)
    setError(null)

    try {
      const { data, error: apiError } = await authApi.verifyEmail(token)

      if (apiError) {
        setError(apiError)
        return
      }

      if (data) {
        setIsVerified(true)
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendEmail = async () => {
    if (!email) {
      setError('이메일 주소를 찾을 수 없습니다.')
      return
    }

    setResendLoading(true)
    setError(null)

    try {
      const { error: apiError } = await authApi.resendVerification({ email })

      if (apiError) {
        setError(apiError)
      }
    } finally {
      setResendLoading(false)
    }
  }

  // 토큰 있음 - 인증 처리 중
  if (token && isVerifying) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <Image src="/peach_logo_transparent.png" alt="피치마켓" width={40} height={40} className="w-10 h-10" />
          <span className="text-xl font-bold text-primary">피치마켓</span>
        </Link>

        <Card className="w-full max-w-md">
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <IconLoader2 className="size-12 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">이메일 인증 중...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 토큰 있음 - 인증 성공
  if (token && isVerified) {
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
              <h2 className="text-2xl font-bold">이메일 인증 완료!</h2>
              <p className="text-muted-foreground">이제 피치마켓의 모든 기능을 이용하실 수 있습니다.</p>
            </div>

            <Button asChild className="w-full">
              <Link href="/login">로그인하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 토큰 있음 - 인증 실패
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <Image src="/peach_logo_transparent.png" alt="피치마켓" width={40} height={40} className="w-10 h-10" />
          <span className="text-xl font-bold text-primary">피치마켓</span>
        </Link>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">이메일 인증 실패</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 flex items-start gap-3">
              <IconAlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-destructive font-medium">{error}</p>
                <p className="text-xs text-muted-foreground">인증 링크가 만료되었거나 유효하지 않을 수 있습니다.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button asChild variant="outline">
                <Link href="/login">로그인으로 돌아가기</Link>
              </Button>
              {email && (
                <Button onClick={handleResendEmail} disabled={resendLoading}>
                  {resendLoading ? (
                    <>
                      <IconLoader2 className="size-4 mr-2 animate-spin" />
                      재발송 중...
                    </>
                  ) : (
                    '인증 이메일 재발송'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 기본값: 로딩 상태 (이론상 도달하지 않음)
  return null
}
