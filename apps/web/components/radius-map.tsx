'use client'

import { IconExternalLink } from '@tabler/icons-react'

// 원형을 폴리곤 path 포인트로 변환 (Static Maps API용)
function buildCirclePath(lat: number, lng: number, radiusKm: number, numPoints = 32): string {
  const latDeg = radiusKm / 111.32
  const lngDeg = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))
  return Array.from({ length: numPoints + 1 }, (_, i) => {
    const angle = (i * 2 * Math.PI) / numPoints
    return `${(lat + latDeg * Math.cos(angle)).toFixed(5)},${(lng + lngDeg * Math.sin(angle)).toFixed(5)}`
  }).join('|')
}

function getZoom(radiusKm: number): number {
  if (radiusKm <= 1) return 14
  if (radiusKm <= 3) return 13
  if (radiusKm <= 5) return 12
  return 11
}

type RadiusMapProps = {
  lat: number
  lng: number
  radiusKm: number
}

export function RadiusMap({ lat, lng, radiusKm }: RadiusMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return null

  const circlePath = buildCirclePath(lat, lng, radiusKm)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

  const staticMapUrl =
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${lat},${lng}` +
    `&zoom=${getZoom(radiusKm)}` +
    `&size=600x400` +
    `&scale=2` +
    `&markers=color:0xFF6B35|${lat},${lng}` +
    `&path=color:0xFF6B35FF|weight:2|fillcolor:0xFF6B3533|${circlePath}` +
    `&style=feature:poi|visibility:off` +
    `&style=feature:transit|visibility:off` +
    `&key=${apiKey}`

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block relative group rounded-xl overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={staticMapUrl} alt={`반경 ${radiusKm}km 지도`} className="w-full h-64 object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow">
          <IconExternalLink className="w-3.5 h-3.5" />
          Google Maps에서 보기
        </span>
      </div>
    </a>
  )
}
