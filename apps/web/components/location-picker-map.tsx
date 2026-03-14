'use client'

import { useEffect, useRef, useState } from 'react'
import { IconLoader2, IconCurrentLocation } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

/* eslint-disable @typescript-eslint/no-explicit-any */

const CITY_TYPES = [
  'locality',
  'sublocality_level_1',
  'sublocality',
  'administrative_area_level_3',
  'neighborhood',
  'postal_town',
]

type LocationPickerResult = {
  lat: number
  lng: number
  formatted: string
}

type LocationPickerMapProps = {
  initialLat?: number
  initialLng?: number
  onConfirm: (result: LocationPickerResult) => void
}

export function LocationPickerMap({ initialLat, initialLng, onConfirm }: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [currentLocLoading, setCurrentLocLoading] = useState(false)

  const defaultLat = initialLat ?? 33.9712
  const defaultLng = initialLng ?? -84.1499 // Duluth, GA

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || !mapRef.current) return

    const initMap = () => {
      if (!mapRef.current) return
      const gmaps = (window as any).google.maps
      const map = new gmaps.Map(mapRef.current, {
        center: { lat: defaultLat, lng: defaultLng },
        zoom: 13,
        gestureHandling: 'greedy',
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      })
      mapInstanceRef.current = map
    }

    if ((window as any).google?.maps) {
      initMap()
    } else {
      const existingScript = document.querySelector('#gmaps-script') as HTMLScriptElement | null
      if (existingScript) {
        existingScript.addEventListener('load', initMap, { once: true })
      } else {
        const script = document.createElement('script')
        script.id = 'gmaps-script'
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
        script.async = true
        script.addEventListener('load', initMap, { once: true })
        document.head.appendChild(script)
      }
    }

    return () => {
      mapInstanceRef.current = null
    }
  }, [defaultLat, defaultLng]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoToCurrentLocation = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return
    setCurrentLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapInstanceRef.current.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        mapInstanceRef.current.setZoom(14)
        setCurrentLocLoading(false)
      },
      () => setCurrentLocLoading(false),
      { timeout: 10000 }
    )
  }

  const handleConfirm = async () => {
    if (!mapInstanceRef.current) return
    setConfirmLoading(true)

    const center = mapInstanceRef.current.getCenter()
    const lat: number = center.lat()
    const lng: number = center.lng()

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    let formatted = `${lat.toFixed(4)}, ${lng.toFixed(4)}`

    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`)
      const data = await res.json()
      const components = data.results?.[0]?.address_components ?? []
      const city = components.find((c: any) => c.types.some((t: string) => CITY_TYPES.includes(t)))?.long_name
      const state = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.short_name
      if (city && state) formatted = `${city}, ${state}`
      else if (state) formatted = state
    } catch {
      // fallback to coordinates
    }

    setConfirmLoading(false)
    onConfirm({ lat, lng, formatted })
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div ref={mapRef} className="w-full h-[576px] rounded-xl" />
        {/* 크로스헤어 */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-8 h-8">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-primary -translate-y-1/2 opacity-80" />
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-primary -translate-x-1/2 opacity-80" />
            <div className="absolute inset-0 m-auto w-3 h-3 rounded-full border-2 border-primary bg-white shadow-sm" />
          </div>
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground">지도를 움직여 거래 장소를 선택하세요</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleGoToCurrentLocation}
          disabled={currentLocLoading}
          className="flex items-center gap-1.5 shrink-0"
        >
          {currentLocLoading ? (
            <IconLoader2 className="w-4 h-4 animate-spin" />
          ) : (
            <IconCurrentLocation className="w-4 h-4" />
          )}
          내 현재위치로 이동
        </Button>
        <Button onClick={handleConfirm} disabled={confirmLoading} className="flex-1">
          {confirmLoading && <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />}이 위치로 설정
        </Button>
      </div>
    </div>
  )
}
