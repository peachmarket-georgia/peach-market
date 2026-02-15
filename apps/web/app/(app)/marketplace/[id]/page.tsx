'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { use } from 'react'
import { ChevronLeft, Heart, MessageCircle, Eye, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getProductById, STATUS_LABEL } from '@/lib/data'
import { cn } from '@/lib/utils'

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

const ProductDetailPage = ({ params }: ProductDetailPageProps) => {
  const { id } = use(params)
  const product = getProductById(id)

  if (!product) {
    notFound()
  }

  const isSold = product.status === 'SOLD'
  const isReserved = product.status === 'RESERVED'
  const isSelling = product.status === 'SELLING'

  return (
    <div className="max-w-4xl mx-auto pb-20 md:pb-0">
      {/* 모바일 뒤로가기 */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/marketplace"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          목록으로
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        {/* 이미지 캐러셀 */}
        <ImageCarousel
          images={product.images}
          alt={product.title}
          status={product.status}
        />

        {/* 상품 정보 */}
        <div>
          {/* 카테고리 + 상태 뱃지 */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs font-normal">
              {product.category}
            </Badge>
            <Badge
              className={cn(
                'text-xs',
                isSelling && 'bg-green-500 text-white hover:bg-green-600',
                isReserved && 'bg-amber-500 text-white hover:bg-amber-600',
                isSold && 'bg-gray-400 text-white hover:bg-gray-500'
              )}
            >
              {STATUS_LABEL[product.status]}
            </Badge>
          </div>

          {/* 제목 */}
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">
            {product.title}
          </h1>

          {/* 위치 · 시간 */}
          <p className="text-sm text-muted-foreground mb-4">
            {product.location} · {product.timeAgo}
          </p>

          {/* 가격 */}
          <p
            className={cn(
              'text-2xl font-bold mb-4',
              isSold ? 'text-muted-foreground line-through' : 'text-foreground'
            )}
          >
            ${product.price.toLocaleString()}
          </p>

          {/* 통계 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {product.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {product.chatCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {product.likeCount}
            </span>
          </div>

          {/* 설명 */}
          <div className="border-t border-border pt-6 mb-6">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* 판매자 정보 */}
          <div className="border-t border-border pt-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted">
                <Image
                  src={product.seller.avatarUrl}
                  alt={product.seller.nickname}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {product.seller.nickname}
                </p>
                <p className="text-sm text-muted-foreground">
                  매너점수 {product.seller.mannerScore}
                </p>
              </div>
            </div>
          </div>

          {/* 데스크톱 액션 버튼 */}
          <div className="hidden md:flex gap-3">
            <Button variant="outline" size="lg" disabled={isSold}>
              <Heart className="h-4 w-4 mr-1" />
              관심
            </Button>
            <Button variant="outline" size="lg">
              <Share2 className="h-4 w-4 mr-1" />
              공유
            </Button>
            <Button size="lg" className="flex-1" disabled={isSold}>
              <MessageCircle className="h-4 w-4 mr-1" />
              채팅하기
            </Button>
          </div>
        </div>
      </div>

      {/* 모바일 하단 고정 액션바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-3 flex items-center gap-3 md:hidden z-30">
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          disabled={isSold}
        >
          <Heart className="h-5 w-5" />
        </Button>
        <div className="flex-1 text-center">
          <p
            className={cn(
              'text-lg font-bold',
              isSold ? 'text-muted-foreground line-through' : 'text-foreground'
            )}
          >
            ${product.price.toLocaleString()}
          </p>
        </div>
        <Button className="flex-1" disabled={isSold}>
          <MessageCircle className="h-4 w-4 mr-1" />
          채팅하기
        </Button>
      </div>
    </div>
  )
}

/** 이미지 캐러셀 컴포넌트 */
const ImageCarousel = ({
  images,
  alt,
  status,
}: {
  images: string[]
  alt: string
  status: string
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const isSold = status === 'SOLD'
  const isReserved = status === 'RESERVED'

  return (
    <div className="space-y-3">
      {/* 메인 이미지 */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <Image
          src={images[currentIndex] ?? images[0]!}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />

        {isReserved && (
          <span className="absolute top-3 left-3 px-3 py-1 text-sm font-medium bg-amber-500 text-white rounded">
            {STATUS_LABEL.RESERVED}
          </span>
        )}
        {isSold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xl font-medium">
              {STATUS_LABEL.SOLD}
            </span>
          </div>
        )}

        {/* 인디케이터 dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  idx === currentIndex ? 'bg-white' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* 데스크톱 썸네일 */}
      {images.length > 1 && (
        <div className="hidden md:flex gap-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'relative w-20 h-20 rounded-lg overflow-hidden bg-muted transition-opacity',
                idx === currentIndex
                  ? 'ring-2 ring-primary'
                  : 'opacity-60 hover:opacity-100'
              )}
            >
              <Image
                src={img}
                alt={`${alt} ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductDetailPage
