'use client'

import { useState, useCallback } from 'react'
import { IconLoader2, IconCheck, IconAlertCircle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { userApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { validateNickname } from '@/utils'
import { useDebouncedCheck } from '@/hooks/use-debounced-check'
import { GEORGIA_LOCATIONS } from '@/constants'

type ProfileSetupFormProps = {
  initialNickname?: string
  initialLocation?: string
  onSubmit: (data: { nickname: string; location: string }) => Promise<void>
  submitLabel: string
  onBack?: () => void
  isLoading: boolean
}

export function ProfileSetupForm({
  initialNickname = '',
  initialLocation = '',
  onSubmit,
  submitLabel,
  onBack,
  isLoading,
}: ProfileSetupFormProps) {
  const [nickname, setNickname] = useState(initialNickname)
  const [location, setLocation] = useState(initialLocation)
  const [locationError, setLocationError] = useState<string | null>(null)

  const checkNickname = useCallback((value: string) => userApi.checkNickname(value), [])

  const {
    isChecking: checkingNickname,
    isAvailable: nicknameAvailable,
    error: nicknameError,
    check: triggerNicknameCheck,
    reset: resetNicknameCheck,
  } = useDebouncedCheck(checkNickname, validateNickname, '닉네임은 2~20자로 입력해주세요')

  const handleNicknameChange = (value: string) => {
    setNickname(value)
    resetNicknameCheck()
  }

  const handleNicknameBlur = () => {
    if (nickname) {
      triggerNicknameCheck(nickname)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nickname || !validateNickname(nickname)) return
    if (nicknameAvailable === false) return

    if (!location) {
      setLocationError('거주 지역을 선택해주세요')
      return
    }

    // 닉네임 체크가 아직 안 됐으면 체크 먼저
    if (nicknameAvailable === null) {
      triggerNicknameCheck(nickname)
      return
    }

    setLocationError(null)
    await onSubmit({ nickname, location })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 닉네임 */}
      <div className="space-y-2">
        <Label htmlFor="nickname" className="text-base font-medium">
          닉네임 <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">다른 사용자에게 보여지는 이름입니다 (2~20자)</p>
        <div className="relative">
          <Input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => handleNicknameChange(e.target.value)}
            onBlur={handleNicknameBlur}
            placeholder="닉네임을 입력하세요"
            autoComplete="username"
            disabled={isLoading}
            maxLength={20}
            className={cn(
              'h-12 text-base',
              nicknameAvailable === true && 'border-success',
              (nicknameAvailable === false || nicknameError) && 'border-destructive'
            )}
            required
          />
          {checkingNickname && (
            <IconLoader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-5 animate-spin text-muted-foreground" />
          )}
        </div>
        {nicknameAvailable === true && (
          <p className="text-sm text-success flex items-center gap-1">
            <IconCheck className="size-4" />
            사용 가능한 닉네임입니다
          </p>
        )}
        {nicknameError && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <IconAlertCircle className="size-4" />
            {nicknameError}
          </p>
        )}
      </div>

      {/* 거주 지역 */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-base font-medium">
          거주 지역 <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">가까운 지역의 매물을 볼 수 있습니다</p>
        <select
          id="location"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value)
            setLocationError(null)
          }}
          disabled={isLoading}
          className={cn(
            'w-full h-12 rounded-md border border-input bg-background px-3 text-base ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            locationError && 'border-destructive'
          )}
          required
        >
          <option value="">지역을 선택해주세요</option>
          {GEORGIA_LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
        {locationError && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <IconAlertCircle className="size-4" />
            {locationError}
          </p>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex flex-col gap-3 pt-2">
        <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
          {isLoading ? (
            <>
              <IconLoader2 className="size-5 mr-2 animate-spin" />
              처리 중...
            </>
          ) : (
            submitLabel
          )}
        </Button>
        {onBack && (
          <Button type="button" variant="ghost" className="w-full h-12 text-base" onClick={onBack} disabled={isLoading}>
            이전으로
          </Button>
        )}
      </div>
    </form>
  )
}
