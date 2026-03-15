'use client'

import { useEffect, useRef } from 'react'
import { checkAuth, tryRefresh } from '@/lib/api'
import { UserProfileResponseDto } from '@/types/api'

const CHANNEL_NAME = 'peach-session-refresh'
const DEFAULT_MIN_INTERVAL = 60_000

type UseSessionKeepAliveOptions = {
  onSessionRestored: (user: UserProfileResponseDto) => void
  onSessionExpired: () => void
  enabled: boolean
  minIntervalMs?: number
}

export function useSessionKeepAlive({
  onSessionRestored,
  onSessionExpired,
  enabled,
  minIntervalMs = DEFAULT_MIN_INTERVAL,
}: UseSessionKeepAliveOptions): void {
  const lastCheckRef = useRef<number>(Date.now())
  const callbacksRef = useRef({ onSessionRestored, onSessionExpired })
  callbacksRef.current = { onSessionRestored, onSessionExpired }

  useEffect(() => {
    if (!enabled) return

    let channel: BroadcastChannel | null = null
    try {
      channel = new BroadcastChannel(CHANNEL_NAME)
      channel.onmessage = (event) => {
        if (event.data?.type === 'session-refreshed') {
          lastCheckRef.current = Date.now()
          checkAuth().then(({ isAuthenticated, user }) => {
            if (isAuthenticated && user) {
              callbacksRef.current.onSessionRestored(user)
            } else {
              callbacksRef.current.onSessionExpired()
            }
          })
        }
      }
    } catch {
      // BroadcastChannel not supported
    }

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return

      const elapsed = Date.now() - lastCheckRef.current
      if (elapsed < minIntervalMs) return

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'

      try {
        const refreshed = await tryRefresh(apiUrl)
        lastCheckRef.current = Date.now()

        if (refreshed) {
          try {
            channel?.postMessage({ type: 'session-refreshed' })
          } catch {
            // channel closed
          }

          const { isAuthenticated, user } = await checkAuth()
          if (isAuthenticated && user) {
            callbacksRef.current.onSessionRestored(user)
          } else {
            callbacksRef.current.onSessionExpired()
          }
        } else {
          callbacksRef.current.onSessionExpired()
        }
      } catch {
        // Network error; will retry on next foreground event
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      channel?.close()
    }
  }, [enabled, minIntervalMs])
}
