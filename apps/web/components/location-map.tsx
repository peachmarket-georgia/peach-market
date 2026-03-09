'use client'

import { IconMapPin, IconExternalLink } from '@tabler/icons-react'

type LocationMapProps = {
  location: string
}

export function LocationMap({ location }: LocationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey || !location) return null

  const encoded = encodeURIComponent(location)

  const staticMapUrl =
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${encoded}` +
    `&zoom=13` +
    `&size=600x500` +
    `&scale=2` +
    `&markers=color:0xFF6B35|${encoded}` +
    `&style=feature:poi|visibility:off` +
    `&style=feature:transit|visibility:off` +
    `&key=${apiKey}`

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`

  return (
    <section className="bg-card rounded-2xl overflow-hidden shadow-sm mb-6">
      {/* 지도 이미지 */}
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={staticMapUrl} alt={`${location} 지도`} className="w-full h-72 object-cover" loading="lazy" />
        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow">
            <IconExternalLink className="w-3.5 h-3.5" />
            Google Maps에서 보기
          </span>
        </div>
      </a>

      {/* 하단 라벨 */}
      <div className="px-4 py-3 flex items-center gap-2">
        <IconMapPin className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-medium text-foreground">{location}</span>
      </div>
    </section>
  )
}
