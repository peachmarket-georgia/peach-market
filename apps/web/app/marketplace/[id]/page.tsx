'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, useRouter } from 'next/navigation'
import { use } from 'react'
import {
  IconChevronLeft,
  IconChevronRight,
  IconHeart,
  IconHeartFilled,
  IconMessageCircle,
  IconEye,
  IconShare,
  IconLoader2,
  IconMapPin,
  IconClock,
  IconPencil,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { chatApi, checkAuth } from '@/lib/api'
import { STATUS_LABEL } from '@/lib/product-types'
import { cn } from '@/lib/utils'
import { getProduct, toProduct, productApi } from '@/lib/products-api'
import { userApi } from '@/lib/api'
import type { Product, ProductStatus } from '@/lib/product-types'

type ProductDetailPageProps = {
  params: Promise<{ id: string }>
}

const ProductDetailPage = ({ params }: ProductDetailPageProps) => {
  const { id } = use(params)
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)

  const handleChat = useCallback(async () => {
    if (chatLoading) return
    setChatLoading(true)
    try {
      const { isAuthenticated } = await checkAuth()
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      const { data, error: chatError } = await chatApi.createRoom(id)
      if (chatError) {
        alert(chatError)
        return
      }
      if (data) {
        router.push(`/chat/${data.id}`)
      }
    } catch {
      alert('채팅방을 생성할 수 없습니다.')
    } finally {
      setChatLoading(false)
    }
  }, [chatLoading, id, router])
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    getProduct(id)
      .then((data) => {
        setProduct(toProduct(data))
        const raw = data as unknown as { favoriteCount: number; isFavorited: boolean }
        setFavoriteCount(raw.favoriteCount ?? 0)
        setIsFavorited(raw.isFavorited ?? false)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))

    userApi.getMe().then(({ data }) => {
      if (data) setCurrentUserId(data.id)
    })
  }, [id])

  const handleStatusChange = async (newStatus: ProductStatus) => {
    if (statusLoading || !product) return
    setStatusLoading(true)
    const { data } = await productApi.updateProductStatus(id, newStatus)
    if (data) setProduct((prev) => (prev ? { ...prev, status: data.status as ProductStatus } : prev))
    setStatusLoading(false)
  }

  const handleFavoriteToggle = async () => {
    if (favoriteLoading) return
    setFavoriteLoading(true)
    const prev = isFavorited
    setIsFavorited(!prev)
    setFavoriteCount((c) => c + (prev ? -1 : 1))
    const { data } = await productApi.toggleFavorite(id)
    if (!data) {
      setIsFavorited(prev)
      setFavoriteCount((c) => c + (prev ? 1 : -1))
    }
    setFavoriteLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !product) {
    notFound()
  }

  const isSold = product.status === 'ENDED' || product.status === 'CONFIRMED'
  const isConfirmed = product.status === 'CONFIRMED'
  const isOwner = !!(currentUserId && currentUserId === product.seller.id)

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-24 md:pb-8 md:mt-10">
      {/* 뒤로가기 + 수정 */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/marketplace"
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-all hover:gap-0.5"
        >
          <IconChevronLeft className="h-4 w-4" />
          목록으로
        </Link>
        {isOwner && (
          <Link
            href={`/marketplace/${id}/edit`}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <IconPencil className="h-4 w-4" />
            수정
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:gap-10">
        {/* 이미지 캐러셀 */}
        <ImageCarousel images={product.images} alt={product.title} status={product.status} />

        {/* 상품 정보 */}
        <div className="flex flex-col">
          {/* 카테고리 + 상태 뱃지 */}
          <div className="flex items-center gap-2 mb-4">
            <Badge
              variant="secondary"
              className="text-xs font-medium px-3 py-1 bg-primary/10 text-primary border-primary/20 shadow-sm"
            >
              {product.category}
            </Badge>
            <Badge
              className={cn(
                'text-xs font-medium px-3 py-1 shadow-sm transition-all',
                product.status === 'SELLING' && 'bg-success-subtle text-success',
                product.status === 'RESERVED' && 'bg-warning-subtle text-warning',
                product.status === 'CONFIRMED' && 'bg-success-subtle text-success',
                product.status === 'ENDED' && 'bg-muted text-muted-foreground'
              )}
            >
              {STATUS_LABEL[product.status]}
            </Badge>
          </div>

          {/* 제목 */}
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">{product.title}</h1>

          {/* 위치 · 시간 */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <IconMapPin className="h-3.5 w-3.5" />
              {product.location}
            </span>
            <span className="flex items-center gap-1">
              <IconClock className="h-3.5 w-3.5" />
              {product.timeAgo}
            </span>
          </div>

          {/* 가격 */}
          <div className="mb-6">
            <p
              className={cn(
                'text-3xl md:text-4xl font-extrabold transition-colors',
                isSold
                  ? 'text-muted-foreground line-through'
                  : 'text-transparent bg-linear-to-r from-peach to-peach-hover bg-clip-text'
              )}
            >
              ${product.price.toLocaleString()}
            </p>
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-5 text-sm pb-5 border-b border-border/50">
            <span className="flex items-center gap-1.5 text-muted-foreground hover:text-blue-500 transition-colors cursor-default">
              <IconEye className="h-4 w-4" />
              <span className="font-medium">조회 {product.viewCount}</span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground hover:text-green-500 transition-colors cursor-default">
              <IconMessageCircle className="h-4 w-4" />
              <span className="font-medium">채팅 {product.chatCount}</span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors cursor-default">
              <IconHeart className="h-4 w-4" />
              <span className="font-medium">관심 {favoriteCount}</span>
            </span>
          </div>

          {/* 판매자 정보 */}
          <div className="py-5 border-b border-border/50">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-linear-to-br from-background to-muted/20 hover:shadow-md transition-all cursor-pointer group">
              {product.seller.avatarUrl ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted ring-2 ring-primary/20 shadow-md group-hover:ring-primary/40 transition-all">
                  <Image
                    src={product.seller.avatarUrl}
                    alt={product.seller.nickname}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-peach to-peach-hover flex items-center justify-center text-white font-bold text-base shadow-md">
                  {product.seller.nickname[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {product.seller.nickname}
                </p>
              </div>
            </div>
          </div>

          {/* 설명 */}
          <div className="py-5 border-b border-border/50">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-linear-to-b from-peach to-peach-hover rounded-full" />
              상품 설명
            </h2>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pl-3">
              {product.description || '등록된 상품 설명이 없습니다.'}
            </p>
          </div>

          {/* 데스크톱 액션 버튼 */}
          <div className="hidden md:flex gap-3 pt-6">
            {isOwner ? (
              <>
                {isConfirmed ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#F3E8FF]/60 border border-[#6B21A8]/20">
                    <span className="text-sm font-semibold text-[#6B21A8]">판매 확정된 상품입니다</span>
                  </div>
                ) : (
                  <>
                    {product.status !== 'SELLING' && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleStatusChange('SELLING')}
                        disabled={statusLoading}
                        className="gap-2 border-2 border-success/40 text-success bg-success-subtle/50 hover:bg-success-subtle hover:scale-105 transition-all shadow-sm"
                      >
                        판매중
                      </Button>
                    )}
                    {product.status !== 'ENDED' && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleStatusChange('ENDED')}
                        disabled={statusLoading}
                        className="gap-2 border-2 border-border text-muted-foreground bg-muted/50 hover:bg-muted hover:scale-105 transition-all shadow-sm disabled:opacity-60"
                      >
                        판매종료
                      </Button>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  className={cn(
                    'gap-2 border-2 hover:scale-105 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:hover:scale-100',
                    isFavorited
                      ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary'
                      : 'border-primary/30 text-primary hover:bg-primary/10 hover:border-primary'
                  )}
                  disabled={isSold || favoriteLoading}
                  onClick={handleFavoriteToggle}
                >
                  {isFavorited ? <IconHeartFilled className="h-5 w-5" /> : <IconHeart className="h-5 w-5" />}
                  <span className="font-semibold">관심 {favoriteCount}</span>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 border-2 hover:border-secondary/50 hover:bg-secondary/10 hover:scale-105 transition-all shadow-sm hover:shadow-md"
                >
                  <IconShare className="h-5 w-5" />
                  <span className="font-semibold">공유</span>
                </Button>
                <Button
                  size="lg"
                  className="flex-1 gap-2 bg-linear-to-r from-peach to-peach-hover text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  disabled={isSold || chatLoading}
                  onClick={handleChat}
                >
                  <IconMessageCircle className="h-5 w-5" />
                  {chatLoading ? '연결 중...' : '채팅하기'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 모바일 하단 고정 액션바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-md border-t-2 border-primary/10 px-4 py-3 flex items-center gap-3 md:hidden z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {isOwner ? (
          <>
            {isConfirmed ? (
              <div className="flex-1 flex items-center justify-center px-3 py-2 rounded-xl bg-[#F3E8FF]/60 border border-[#6B21A8]/20">
                <span className="text-sm font-semibold text-[#6B21A8]">판매 확정</span>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-w-0">
                <span className="text-xs text-muted-foreground font-medium mb-1">상태 변경</span>
                <div className="flex gap-2">
                  {product.status !== 'SELLING' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('SELLING')}
                      disabled={statusLoading}
                      className="flex-1 border-2 border-[#166534]/40 text-[#166534] bg-[#DCFCE7]/50 hover:bg-[#DCFCE7] active:scale-95 transition-all h-10"
                    >
                      판매중
                    </Button>
                  )}
                  {product.status !== 'ENDED' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange('ENDED')}
                      disabled={statusLoading}
                      className="flex-1 border-2 border-[#6B7280]/40 text-[#6B7280] bg-[#F3F4F6]/50 hover:bg-[#F3F4F6] active:scale-95 transition-all h-10"
                    >
                      판매완료
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'shrink-0 h-12 w-12 border-2 text-primary active:scale-95 transition-all shadow-sm disabled:opacity-50',
                isFavorited
                  ? 'border-primary bg-primary/10 hover:bg-primary/20'
                  : 'border-primary/40 hover:bg-primary/10 hover:border-primary'
              )}
              disabled={isSold || favoriteLoading}
              onClick={handleFavoriteToggle}
            >
              {isFavorited ? <IconHeartFilled className="h-6 w-6" /> : <IconHeart className="h-6 w-6" />}
            </Button>
            <div className="border-l border-border/30 h-10 mx-0.5" />
            <div className="flex-1 flex flex-col min-w-0 mr-2">
              <span className="text-xs text-muted-foreground font-medium">판매가격</span>
              <p
                className={cn(
                  'text-xl font-extrabold truncate',
                  isSold
                    ? 'text-muted-foreground line-through'
                    : 'text-transparent bg-linear-to-r from-peach to-peach-hover bg-clip-text'
                )}
              >
                ${product.price.toLocaleString()}
              </p>
            </div>
            <Button
              className="shrink-0 h-12 px-6 gap-2 bg-linear-to-r from-peach to-peach-hover text-white font-bold shadow-lg active:scale-95 transition-all disabled:opacity-60"
              disabled={isSold || chatLoading}
              onClick={handleChat}
            >
              <IconMessageCircle className="h-5 w-5" />
              {chatLoading ? '연결 중...' : '채팅하기'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

/** 이미지 캐러셀 컴포넌트 */
const ImageCarousel = ({ images, alt, status }: { images: string[]; alt: string; status: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const isSold = status === 'ENDED' || status === 'CONFIRMED'
  const hasMultiple = images.length > 1

  const goTo = (idx: number) => {
    if (idx < 0) setCurrentIndex(images.length - 1)
    else if (idx >= images.length) setCurrentIndex(0)
    else setCurrentIndex(idx)
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
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted group shadow-lg">
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
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-foreground flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-lg active:scale-95"
            >
              <IconChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => goTo(currentIndex + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-foreground flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-lg active:scale-95"
            >
              <IconChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* 인디케이터 dots + 카운터 */}
        {hasMultiple && (
          <>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/30 backdrop-blur-md px-3 py-2 rounded-full">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    'rounded-full transition-all',
                    idx === currentIndex ? 'bg-white w-6 h-2.5 shadow-md' : 'bg-white/50 hover:bg-white/80 w-2.5 h-2.5'
                  )}
                />
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

export default ProductDetailPage
