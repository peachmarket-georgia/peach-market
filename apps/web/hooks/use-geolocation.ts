'use client'

import { useState } from 'react'

type GeolocationState = {
  loading: boolean
  error: string | null
}

export type GeolocationResult = {
  formatted: string
  lat: number
  lng: number
}

async function reverseGeocode(lat: number, lng: number): Promise<GeolocationResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) throw new Error('Google Maps API 키가 설정되지 않았습니다')

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=en&region=US`
  )
  const data = await res.json()

  if (data.status !== 'OK' || !data.results?.length) {
    throw new Error('주소를 가져올 수 없습니다')
  }

  // locality(city), administrative_area_level_1(state) 추출
  let city = ''
  let state = ''

  for (const result of data.results) {
    for (const component of result.address_components) {
      if (!city && component.types.includes('locality')) {
        city = component.long_name
      }
      if (!state && component.types.includes('administrative_area_level_1')) {
        state = component.short_name // "GA"
      }
    }
    if (city && state) break
  }

  if (!city || !state) throw new Error('도시/주 정보를 찾을 수 없습니다')

  return { formatted: `${city}, ${state}`, lat, lng }
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ loading: false, error: null })

  const getLocation = (): Promise<GeolocationResult | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setState({ loading: false, error: '이 브라우저는 위치 서비스를 지원하지 않습니다' })
        resolve(null)
        return
      }

      setState({ loading: true, error: null })

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { lat, lng } = { lat: position.coords.latitude, lng: position.coords.longitude }
            const result = await reverseGeocode(lat, lng)
            setState({ loading: false, error: null })
            resolve(result)
          } catch (err) {
            const message = err instanceof Error ? err.message : '위치 변환에 실패했습니다'
            setState({ loading: false, error: message })
            resolve(null)
          }
        },
        (err) => {
          const messages: Record<number, string> = {
            1: '위치 접근이 거부되었습니다. 브라우저 설정에서 허용해주세요',
            2: '위치를 확인할 수 없습니다',
            3: '위치 요청 시간이 초과되었습니다',
          }
          setState({ loading: false, error: messages[err.code] ?? '위치를 가져오는데 실패했습니다' })
          resolve(null)
        },
        { timeout: 10000, maximumAge: 60000 }
      )
    })
  }

  return { ...state, getLocation }
}
