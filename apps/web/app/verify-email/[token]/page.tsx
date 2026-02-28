import { Suspense } from 'react'
import { VerifyEmailTokenClient } from '@/components/auth/verify-email-token-client'

export const metadata = {
  title: '이메일 인증 처리',
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailTokenClient />
    </Suspense>
  )
}
