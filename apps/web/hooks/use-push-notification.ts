'use client'

import { useEffect, useState, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new Uint8Array(rawData.length) as Uint8Array<ArrayBuffer>
  for (let i = 0; i < rawData.length; i++) buffer[i] = rawData.charCodeAt(i)
  return buffer
}

export function usePushNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setIsSupported(supported)
    if (supported) setPermission(Notification.permission)
  }, [])

  // 서비스 워커 등록 + 기존 구독 상태 확인
  useEffect(() => {
    if (!isSupported) return
    navigator.serviceWorker.register('/sw.js').catch(console.error)
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setIsSubscribed(true)
      })
    )
  }, [isSupported])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    const perm = await Notification.requestPermission()
    setPermission(perm)
    if (perm !== 'granted') return false

    try {
      const registration = await navigator.serviceWorker.ready

      // VAPID public key 가져오기
      const res = await fetch(`${API_URL}/api/push/vapid-public-key`, { credentials: 'include' })
      const { publicKey } = await res.json()
      if (!publicKey) return false

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      await fetch(`${API_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(subscription),
      })

      setIsSubscribed(true)
      return true
    } catch (err) {
      console.error('Push subscription failed:', err)
      return false
    }
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return

    await fetch(`${API_URL}/api/push/unsubscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    })

    await subscription.unsubscribe()
    setIsSubscribed(false)
  }, [isSupported])

  return { permission, isSubscribed, isSupported, subscribe, unsubscribe }
}
