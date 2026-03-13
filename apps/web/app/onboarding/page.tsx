'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { IconLoader2 } from '@tabler/icons-react'
import { Card, CardContent } from '@/components/ui/card'
import { ProfileSetupForm } from '@/components/auth/profile-setup-form'
import { checkAuth, userApi } from '@/lib/api'
import { toast } from 'sonner'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [initialNickname, setInitialNickname] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth().then(({ isAuthenticated, user }) => {
      if (!isAuthenticated) {
        router.replace('/login')
        return
      }
      if (user?.isProfileComplete) {
        router.replace('/marketplace')
        return
      }
      setInitialNickname(user?.nickname ?? '')
      setLoading(false)
    })
  }, [router])

  const handleSubmit = async (data: { nickname: string; location: string }) => {
    setSubmitting(true)
    setError(null)

    try {
      const { error: apiError } = await userApi.completeProfile(data)

      if (apiError) {
        setError(apiError)
        return
      }

      toast.success('프로필 설정이 완료되었습니다!')
      router.push('/marketplace')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* 로고 */}
      <div className="flex items-center gap-2 mb-6">
        <Image src="/peach_logo_transparent.png" alt="피치마켓" width={40} height={40} className="w-10 h-10" />
        <span className="text-xl font-bold text-primary">피치마켓</span>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">환영합니다!</h1>
            <p className="text-muted-foreground">시작하기 전에 프로필을 설정해주세요</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <ProfileSetupForm
            initialNickname={initialNickname}
            onSubmit={handleSubmit}
            submitLabel="시작하기"
            isLoading={submitting}
          />
        </CardContent>
      </Card>
    </div>
  )
}
