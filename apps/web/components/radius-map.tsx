'use client'

import { useEffect, useRef } from 'react'

/* eslint-disable @typescript-eslint/no-explicit-any */

function getZoom(radiusKm: number): number {
  if (radiusKm <= 1.6) return 14
  if (radiusKm <= 5) return 13
  if (radiusKm <= 8) return 12
  if (radiusKm <= 16) return 11
  if (radiusKm <= 32) return 10
  return 9
}

type RadiusMapProps = {
  lat: number
  lng: number
  radiusKm: number
}

export function RadiusMap({ lat, lng, radiusKm }: RadiusMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || !mapRef.current) return

    const initMap = () => {
      if (!mapRef.current) return
      const gmaps = (window as any).google.maps

      const map = new gmaps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: getZoom(radiusKm),
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

      markerRef.current = new gmaps.Marker({
        position: { lat, lng },
        map,
        title: '내 위치',
        icon: {
          path: gmaps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#FF6B35',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      })

      circleRef.current = new gmaps.Circle({
        map,
        center: { lat, lng },
        radius: radiusKm * 1000,
        fillColor: '#FF6B35',
        fillOpacity: 0.15,
        strokeColor: '#FF6B35',
        strokeWeight: 2,
      })
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
      circleRef.current?.setMap(null)
      markerRef.current?.setMap(null)
      circleRef.current = null
      markerRef.current = null
      mapInstanceRef.current = null
    }
  }, [lat, lng]) // eslint-disable-line react-hooks/exhaustive-deps

  // 반경 변경 시 원과 줌만 업데이트
  useEffect(() => {
    if (!circleRef.current || !mapInstanceRef.current) return
    circleRef.current.setRadius(radiusKm * 1000)
    mapInstanceRef.current.setZoom(getZoom(radiusKm))
  }, [radiusKm])

  return <div ref={mapRef} className="w-full h-80 rounded-xl" />
}
