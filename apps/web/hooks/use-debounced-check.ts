import { useState, useRef, useCallback } from 'react'
import type { ApiResponse } from '@/lib/api'
import type { CheckAvailabilityResponseDto } from '@/types/api'

type UseDebouncedCheckReturn = {
  isChecking: boolean
  isAvailable: boolean | null
  error: string | null
  check: (value: string) => void
  reset: () => void
}

export function useDebouncedCheck(
  checkFn: (value: string) => Promise<ApiResponse<CheckAvailabilityResponseDto>>,
  validate: (value: string) => boolean,
  errorMessage: string,
  delay: number = 500
): UseDebouncedCheckReturn {
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = useCallback(() => {
    setIsAvailable(null)
    setError(null)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const check = useCallback(
    (value: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      if (!value || !validate(value)) {
        setIsAvailable(null)
        setError(value ? errorMessage : null)
        return
      }

      setIsChecking(true)
      timerRef.current = setTimeout(async () => {
        try {
          const { data, error: apiError } = await checkFn(value)
          if (apiError) {
            setError(apiError)
            setIsAvailable(null)
          } else if (data) {
            setIsAvailable(data.available)
            setError(data.available ? null : '이미 사용 중입니다')
          }
        } finally {
          setIsChecking(false)
        }
      }, delay)
    },
    [checkFn, validate, errorMessage, delay]
  )

  return { isChecking, isAvailable, error, check, reset }
}
