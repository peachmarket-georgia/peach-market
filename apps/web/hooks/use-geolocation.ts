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

function extractCityState(data: {
  results: { address_components: { long_name: string; short_name: string; types: string[] }[] }[]
}) {
  const CITY_TYPES = [
    'locality',
    'sublocality_level_1',
    'sublocality',
    'administrative_area_level_3',
    'neighborhood',
    'postal_town',
  ]

  let city = ''
  let state = ''

  for (const result of data.results) {
    for (const component of result.address_components) {
      if (!city && CITY_TYPES.some((t) => component.types.includes(t))) {
        city = component.long_name
      }
      if (!state && component.types.includes('administrative_area_level_1')) {
        state = component.short_name
      }
    }
    if (city && state) break
  }

  return { city, state }
}

async function reverseGeocode(lat: number, lng: number): Promise<GeolocationResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) throw new Error('Google Maps API 키가 설정되지 않았습니다')

  const base = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&region=US`

  const [enRes, koRes] = await Promise.all([fetch(`${base}&language=en`), fetch(`${base}&language=ko`)])
  const [enData, koData] = await Promise.all([enRes.json(), koRes.json()])

  if (enData.status !== 'OK' || !enData.results?.length) {
    throw new Error('주소를 가져올 수 없습니다')
  }

  const en = extractCityState(enData)
  const ko = koData.status === 'OK' ? extractCityState(koData) : { city: '', state: '' }

  if (!en.state) throw new Error('위치 정보를 가져올 수 없습니다')

  const enFormatted = en.city ? `${en.city}, ${en.state}` : en.state

  // 한글 도시명이 있고 영어와 다르면 병렬 표기: 둘루스(Duluth, GA)
  if (ko.city && ko.city !== en.city) {
    return { formatted: `${ko.city}(${enFormatted})`, lat, lng }
  }

  return { formatted: enFormatted, lat, lng }
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
