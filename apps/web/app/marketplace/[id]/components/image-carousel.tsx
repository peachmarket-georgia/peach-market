'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { STATUS_LABEL } from '@/lib/product-types'

type Props = {
  images: string[]
  alt: string
  status: string
}

export const ImageCarousel = ({ images, alt, status }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const isSold = status === 'ENDED' || status === 'CONFIRMED'
  const hasMultiple = images.length > 1

  const goTo = (idx: number) => {
    if (idx < 0) setCurrentIndex(images.length - 1)
    else if (idx >= images.length) setCurrentIndex(0)
    else setCurrentIndex(idx)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = Math.abs(touchStartX.current - (e.touches[0]?.clientX ?? 0))
    if (diff > 10) e.preventDefault()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - (e.changedTouches[0]?.clientX ?? 0)
    if (Math.abs(diff) > 40) goTo(currentIndex + (diff > 0 ? 1 : -1))
    touchStartX.current = null
  }

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-linear-to-br from-muted to-muted/50 flex items-center justify-center text-muted-foreground text-sm font-semibold shadow-inner">
        이미지 없음
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 메인 이미지 */}
      <div
        className="relative aspect-square overflow-hidden rounded-2xl bg-muted group shadow-lg touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={images[currentIndex] ?? images[0]!}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority
        />

        {status === 'RESERVED' && (
          <span className="absolute top-3 left-3 px-4 py-1.5 text-sm font-bold bg-[#FEF9C3] text-[#854D0E] rounded-lg shadow-sm">
            {STATUS_LABEL.RESERVED}
          </span>
        )}
        {isSold && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-white text-2xl font-bold bg-black/40 px-6 py-3 rounded-xl backdrop-blur-sm shadow-xl">
              {STATUS_LABEL.ENDED}
            </span>
          </div>
        )}

        {/* 좌우 화살표 */}
        {hasMultiple && (
          <>
            <button
              onClick={() => goTo(currentIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-foreground flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-lg active:scale-95"
            >
              <IconChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => goTo(currentIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-foreground flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-lg active:scale-95"
            >
              <IconChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* 인디케이터 dots + 카운터 */}
        {hasMultiple && (
          <>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex bg-black/30 backdrop-blur-md px-1.5 py-1 rounded-full">
              {images.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentIndex(idx)} className="flex items-center justify-center p-2">
                  <span
                    className={cn(
                      'rounded-full transition-all',
                      idx === currentIndex
                        ? 'bg-white w-6 h-2.5 shadow-md'
                        : 'bg-white/50 hover:bg-white/80 w-2.5 h-2.5'
                    )}
                  />
                </button>
              ))}
            </div>
            <span className="absolute top-3 right-3 px-3 py-1.5 text-xs font-bold bg-black/60 text-white rounded-full backdrop-blur-sm shadow-lg">
              {currentIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* 데스크톱 썸네일 */}
      {hasMultiple && (
        <div className="hidden md:flex gap-3">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'relative w-20 h-20 rounded-xl overflow-hidden bg-muted transition-all',
                idx === currentIndex
                  ? 'ring-3 ring-primary shadow-lg scale-105 opacity-100'
                  : 'opacity-60 hover:opacity-100 hover:scale-105 shadow-md'
              )}
            >
              <Image src={img} alt={`${alt} ${idx + 1}`} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
