'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { IconUserPlus, IconLogin2, IconBrandGoogle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

function AuthGateway() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const query = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* 로고 */}
      <Link href="/" className="flex items-center gap-2 mb-6">
        <Image src="/peach_logo_transparent.png" alt="피치마켓" width={48} height={48} className="w-12 h-12" />
        <span className="text-2xl font-bold text-primary">피치마켓</span>
      </Link>

      <p className="text-lg text-muted-foreground mb-8 text-center">피치마켓에 오신 것을 환영합니다</p>

      <div className="w-full max-w-md space-y-4">
        {/* 회원가입 카드 - 강조 */}
        <Link href={`/signup${query}`} className="block">
          <div className="rounded-2xl border-2 border-primary bg-primary/5 p-6 text-center hover:bg-primary/10 transition-colors">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <IconUserPlus className="size-7 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">처음 오셨나요?</h2>
            <p className="text-sm text-muted-foreground mb-4">계정을 만들고 거래를 시작하세요</p>
            <Button className="w-full h-12 text-base font-bold">
              <IconUserPlus className="size-5 mr-2" />
              회원가입하기
            </Button>
          </div>
        </Link>

        {/* 로그인 카드 */}
        <Link href={`/login${query}`} className="block">
          <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center hover:bg-muted/50 transition-colors">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <IconLogin2 className="size-7 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">이미 계정이 있으신가요?</h2>
            <p className="text-sm text-muted-foreground mb-4">이메일과 비밀번호로 로그인하세요</p>
            <Button variant="outline" className="w-full h-12 text-base font-semibold">
              <IconLogin2 className="size-5 mr-2" />
              로그인하기
            </Button>
          </div>
        </Link>

        {/* 구분선 */}
        <div className="relative py-2">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-sm text-muted-foreground">
            또는
          </span>
        </div>

        {/* Google 로그인 */}
        <Button type="button" variant="outline" className="w-full h-12 text-base" onClick={handleGoogleLogin}>
          <IconBrandGoogle className="size-5 mr-2" />
          Google 계정으로 시작하기
        </Button>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthGateway />
    </Suspense>
  )
}
