/**
 * Native Bridge - 웹에서 React Native 네이티브 기능 호출
 *
 * React Native WebView에서만 작동합니다.
 * 일반 웹 브라우저에서는 null을 반환하거나 no-op로 동작합니다.
 */

interface NativeBridgeMessage {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
}

interface NativeBridgeResult {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  error?: string
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage(message: string): void
    }
    isReactNativeWebView?: boolean
  }
}

/**
 * React Native WebView 환경인지 확인
 */
export function isReactNativeWebView(): boolean {
  return typeof window !== 'undefined' && window.isReactNativeWebView === true
}

/**
 * 네이티브로 메시지 전송
 */
function sendToNative(message: NativeBridgeMessage): void {
  if (!isReactNativeWebView()) {
    console.warn('[Native Bridge] Not in React Native WebView')
    return
  }

  window.ReactNativeWebView?.postMessage(JSON.stringify(message))
}

/**
 * 네이티브로부터 응답 대기
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function waitForNativeResponse<T = any>(messageType: string, timeout = 30000): Promise<T | null> {
  if (!isReactNativeWebView()) {
    return Promise.resolve(null)
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      window.removeEventListener('message', handler)
      reject(new Error(`Timeout waiting for ${messageType}`))
    }, timeout)

    const handler = (event: MessageEvent) => {
      try {
        const message: NativeBridgeResult = JSON.parse(event.data)

        if (message.type === messageType) {
          clearTimeout(timeoutId)
          window.removeEventListener('message', handler)

          if (message.error) {
            reject(new Error(message.error))
          } else {
            resolve(message.data)
          }
        }
      } catch {
        // Ignore parse errors
      }
    }

    window.addEventListener('message', handler)
  })
}

/**
 * 네이티브 카메라 열기
 *
 * @returns 이미지 URI 또는 null (취소/실패 시)
 */
export async function openNativeCamera(): Promise<{
  uri: string
  width: number
  height: number
} | null> {
  if (!isReactNativeWebView()) {
    console.warn('[Native Bridge] Camera not available in web browser')
    return null
  }

  try {
    sendToNative({ type: 'OPEN_CAMERA' })
    const result = await waitForNativeResponse<{
      uri: string
      width: number
      height: number
    }>('CAMERA_RESULT', 60000) // 60초 타임아웃 (사용자가 선택할 시간 필요)

    return result
  } catch (error) {
    console.error('[Native Bridge] Camera error:', error)
    return null
  }
}

/**
 * 현재 위치 조회
 *
 * @returns 위도/경도 또는 null (실패 시)
 */
export async function requestNativeLocation(): Promise<{
  latitude: number
  longitude: number
  accuracy: number | null
} | null> {
  if (!isReactNativeWebView()) {
    console.warn('[Native Bridge] Location not available in web browser')
    return null
  }

  try {
    sendToNative({ type: 'REQUEST_LOCATION' })
    const result = await waitForNativeResponse<{
      latitude: number
      longitude: number
      accuracy: number | null
    }>('LOCATION_RESULT')

    return result
  } catch (error) {
    console.error('[Native Bridge] Location error:', error)
    return null
  }
}

/**
 * 푸시 알림 권한 요청
 *
 * @returns 권한 상태 및 토큰 (허용 시)
 */
export async function requestNotificationPermission(): Promise<{
  granted: boolean
  token?: string
} | null> {
  if (!isReactNativeWebView()) {
    console.warn('[Native Bridge] Notifications not available in web browser')
    return null
  }

  try {
    sendToNative({ type: 'REQUEST_NOTIFICATION_PERMISSION' })
    const result = await waitForNativeResponse<{
      granted: boolean
      token?: string
    }>('NOTIFICATION_PERMISSION')

    return result
  } catch (error) {
    console.error('[Native Bridge] Notification error:', error)
    return null
  }
}

/**
 * 플랫폼 정보 조회
 */
export function getPlatformInfo(): {
  isNative: boolean
  isIOS: boolean
  isAndroid: boolean
  isWeb: boolean
} {
  const isNative = isReactNativeWebView()

  if (!isNative) {
    return {
      isNative: false,
      isIOS: false,
      isAndroid: false,
      isWeb: true,
    }
  }

  const userAgent = navigator.userAgent || ''
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
  const isAndroid = /Android/i.test(userAgent)

  return {
    isNative: true,
    isIOS,
    isAndroid,
    isWeb: false,
  }
}
