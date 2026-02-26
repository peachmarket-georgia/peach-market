'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { IconHeart, IconHeartFilled, IconEye } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { ProductResponseDto } from '@/types/api'

const STATUS_CONFIG = {
  PENDING: { label: '판매 대기', className: 'bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#DBEAFE]' },
  SELLING: { label: '판매 중', className: 'bg-[#DCFCE7] text-[#166534] hover:bg-[#DCFCE7]' },
  RESERVED: { label: '예약 중', className: 'bg-[#FEF9C3] text-[#854D0E] hover:bg-[#FEF9C3]' },
  CONFIRMED: { label: '판매 확정', className: 'bg-[#F3E8FF] text-[#6B21A8] hover:bg-[#F3E8FF]' },
  ENDED: { label: '판매 종료', className: 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]' },
}

type ProductCardProps = {
  product: ProductResponseDto
  onFavoriteToggle?: (id: string) => void
}

export function ProductCard({ product, onFavoriteToggle }: ProductCardProps) {
  const status = STATUS_CONFIG[product.status]
  const priceDisplay = `$${(product.price / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Link href={`/marketplace/${product.id}`} className="group block">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-sm">이미지 없음</span>
          </div>
        )}

        {/* 상태 배지 */}
        <Badge className={`absolute top-2 left-2 ${status.className}`}>{status.label}</Badge>

        {/* 찜 버튼 */}
        {onFavoriteToggle && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onFavoriteToggle(product.id)
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
          >
            {product.isFavorited ? (
              <IconHeartFilled className="w-5 h-5 text-primary" />
            ) : (
              <IconHeart className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}

        {/* 종료 오버레이 */}
        {(product.status === 'CONFIRMED' || product.status === 'ENDED') && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {product.status === 'CONFIRMED' ? '판매 확정' : '판매 종료'}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 space-y-1">
        <h3 className="font-medium text-foreground truncate text-sm sm:text-base">{product.title}</h3>
        <p className="text-base sm:text-lg font-bold text-primary">{priceDisplay}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate max-w-[60%]">{product.location}</span>
          <span className="shrink-0">
            {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true, locale: ko })}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconHeart className="w-3.5 h-3.5" />
            {product.favoriteCount}
          </span>
          <span className="flex items-center gap-1">
            <IconEye className="w-3.5 h-3.5" />
            {product.viewCount}
          </span>
        </div>
      </div>
    </Link>
  )
}
