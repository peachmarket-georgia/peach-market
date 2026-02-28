import { Suspense } from 'react'
import { LoginClient } from '@/components/auth/login-client'

export const metadata = {
  title: '로그인',
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  )
}
