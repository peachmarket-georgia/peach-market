import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IconLoader2 } from '@tabler/icons-react'
import { Card, CardContent } from '@/components/ui/card'
import { VerifyEmailClient } from './verify-email-client'

export const metadata = {
  title: '이메일 인증 안내',
}

function VerifyEmailLoading() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="py-12 flex flex-col items-center gap-6">
        <IconLoader2 className="size-10 text-primary animate-spin" />
        <p className="text-muted-foreground">로딩 중...</p>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailInfoPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Image src="/peach_logo_transparent.png" alt="피치마켓" width={40} height={40} className="w-10 h-10" />
        <span className="text-xl font-bold text-primary">피치마켓</span>
      </Link>

      <Suspense fallback={<VerifyEmailLoading />}>
        <VerifyEmailClient />
      </Suspense>
    </div>
  )
}
