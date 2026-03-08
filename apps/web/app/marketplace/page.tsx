'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  IconSearch,
  IconAdjustmentsHorizontal,
  IconChevronDown,
  IconLoader2,
  IconPlus,
  IconPackage,
  IconX,
  IconBell,
  IconArrowRight,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { usePushNotification } from '@/hooks/use-push-notification'
import { ProductCard } from './components/product-card'
import { CATEGORIES, STATUS_LABEL, SORT_LABELS } from '@/lib/product-types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { productApi } from '@/lib/products-api'
import { userApi } from '@/lib/api'
import type { ProductStatus, Category, SortOption } from '@/lib/product-types'
import type { ProductResponseDto } from '@/types/api'

const STATUS_FILTERS: { value: ProductStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'SELLING', label: STATUS_LABEL.SELLING },
  { value: 'RESERVED', label: STATUS_LABEL.RESERVED },
  { value: 'CONFIRMED', label: STATUS_LABEL.CONFIRMED },
  { value: 'ENDED', label: STATUS_LABEL.ENDED },
]

const MarketplacePage = () => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [products, setProducts] = useState<ProductResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPushBanner, setShowPushBanner] = useState(false)
  const { permission, isSupported, subscribe } = usePushNotification()

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await productApi.getProducts({
        search: searchQuery.trim() || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        sort: sortBy,
      })
      if (error || !data) throw new Error(error)
      setProducts(Array.isArray(data) ? data : (data.products ?? []))
    } catch (e) {
      console.error('Failed to fetch products:', e)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory, selectedStatus, sortBy])

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  useEffect(() => {
    userApi.getMe().then(({ data }) => {
      if (data) {
        setCurrentUserId(data.id)
        setIsAuthenticated(true)
      }
    })
  }, [])

  useEffect(() => {
    if (!isSupported || permission === 'granted' || permission === 'denied') return
    const dismissed = localStorage.getItem('push-banner-dismissed')
    if (!dismissed) setShowPushBanner(true)
  }, [isSupported, permission])

  const handlePushAllow = async () => {
    setShowPushBanner(false)
    await subscribe()
  }

  const handlePushDismiss = () => {
    setShowPushBanner(false)
    localStorage.setItem('push-banner-dismissed', '1')
  }

  const isFiltered = searchQuery !== '' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || sortBy !== 'latest'

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('ALL')
    setSelectedStatus('ALL')
    setSortBy('latest')
  }

  const handleFavoriteToggle = async (id: string) => {
    // 비로그인 사용자는 로그인 유도
    if (!isAuthenticated) {
      toast.info('로그인이 필요합니다', {
        description: '찜하기를 하려면 먼저 로그인해주세요',
        action: {
          label: '로그인',
          onClick: () => router.push(`/login?redirect=/marketplace/${id}`),
        },
      })
      return
    }

    const { data } = await productApi.toggleFavorite(id)
    if (!data) return
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, isFavorited: data.isFavorited, favoriteCount: p.favoriteCount + (data.isFavorited ? 1 : -1) }
          : p
      )
    )
  }

  return (
    <div className="flex flex-col gap-4 md:mt-10">
      <div className="container mx-auto px-4 max-w-5xl md:px-6">
        {/* 헤딩 */}
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold text-foreground">중고거래</h1>
          <p className="text-sm text-fg-tertiary mt-0.5">조지아 한인 중고마켓 🍑</p>
        </div>

        {/* 비로그인 사용자 환영 배너 */}
        {!isAuthenticated && !loading && (
          <div className="mb-4 rounded-xl bg-gradient-to-r from-primary/10 via-peach-subtle to-primary/5 border border-primary/20 px-4 py-4 md:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">조지아 한인 중고마켓 🍑</h2>
                <p className="text-sm text-fg-secondary mt-0.5">회원가입하고 안전하게 거래하세요</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="text-sm font-semibold">
                    로그인
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="text-sm font-semibold gap-1">
                    시작하기
                    <IconArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 푸시 알림 배너 */}
        {showPushBanner && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <IconBell className="size-5 shrink-0 text-primary" />
            <p className="flex-1 text-sm text-foreground">채팅 알림을 받으시겠어요?</p>
            <button
              onClick={handlePushAllow}
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
            >
              허용
            </button>
            <button onClick={handlePushDismiss} className="shrink-0 text-fg-tertiary">
              <IconX className="size-4" />
            </button>
          </div>
        )}

        {/* 검색 + 등록 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
            <Input
              placeholder="상품명, 설명으로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-full bg-white border-2 border-peach-muted focus-visible:ring-0 focus-visible:border-primary shadow-sm placeholder:text-fg-tertiary text-foreground transition-colors"
            />
          </div>
          <Link
            href="/marketplace/new"
            className="flex items-center gap-1.5 shrink-0 h-11 px-5 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-md hover:shadow-lg"
          >
            <IconPlus className="h-4 w-4" />
            <span className="hidden sm:inline">등록</span>
          </Link>
        </div>
      </div>

      {/* 카테고리 필터 - full width scrollable */}
      <div className="container mx-auto max-w-5xl overflow-x-auto scrollbar-hide">
        <div className="inline-flex items-center gap-2.5 px-4 md:px-6 pb-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={cn(
              'shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full text-base font-semibold transition-all',
              selectedCategory === 'ALL'
                ? 'bg-primary text-white shadow-md shadow-primary/30'
                : 'bg-white border-2 border-peach-muted text-fg-secondary hover:border-primary/40 hover:text-primary'
            )}
          >
            전체
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full text-base font-semibold transition-all',
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'bg-white border-2 border-peach-muted text-fg-secondary hover:border-primary/40 hover:text-primary'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl md:px-6 flex flex-col gap-4">
        {/* 상태 필터 + 정렬 */}
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1 min-w-0">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                  className={cn(
                    'shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-base font-semibold transition-all',
                    selectedStatus === filter.value
                      ? 'bg-primary/10 text-primary'
                      : 'text-fg-secondary hover:text-foreground hover:bg-peach-subtle'
                  )}
                >
                  {filter.label}
                </button>
              ))}
              {isFiltered && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 ml-1 px-3 py-2 rounded-lg text-base font-semibold text-fg-secondary hover:text-foreground hover:bg-peach-subtle transition-all"
                >
                  <IconX className="h-4 w-4" />
                  초기화
                </button>
              )}
            </div>
            {/* 오른쪽 그라데이션 */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-linear-to-l from-background to-transparent" />
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1.5 whitespace-nowrap text-base font-medium text-fg-secondary hover:text-primary transition-colors py-2"
            >
              <IconAdjustmentsHorizontal className="h-4 w-4" />
              <span>{SORT_LABELS[sortBy]}</span>
              <IconChevronDown className={cn('h-4 w-4 transition-transform', showSortDropdown && 'rotate-180')} />
            </button>
            {showSortDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                <div className="absolute right-0 top-full mt-2 z-20 bg-white border-2 border-peach-muted rounded-xl shadow-xl py-2 min-w-36 overflow-hidden">
                  {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSortBy(key)
                        setShowSortDropdown(false)
                      }}
                      className={cn(
                        'w-full px-5 py-2.5 text-left text-base transition-colors',
                        sortBy === key
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-fg-secondary hover:bg-peach-subtle hover:text-foreground'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 결과 수 */}
        {!loading && products && (
          <p className="text-sm font-medium text-fg-secondary">
            <span className="text-primary font-bold">{products.length}</span>개의 매물
          </p>
        )}

        {/* 상품 그리드 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-fg-secondary">상품을 불러오는 중...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 xl:grid-cols-5 md:gap-5 pb-10">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onFavoriteToggle={
                  // 비로그인 사용자 또는 본인 상품이 아닌 경우에만 찜하기 활성화
                  !isAuthenticated || product.seller.id !== currentUserId ? handleFavoriteToggle : undefined
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <IconPackage className="h-10 w-10 text-primary/50" />
            </div>
            <p className="text-base font-semibold text-foreground">검색 결과가 없어요</p>
            <p className="text-sm text-fg-secondary">다른 키워드로 검색해 보세요</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MarketplacePage
