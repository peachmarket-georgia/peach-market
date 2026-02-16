'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  IconSearch,
  IconAdjustmentsHorizontal,
  IconChevronDown,
  IconLoader2,
  IconPlus,
} from '@tabler/icons-react'
import { ProductGrid } from '@/components/product'
import { CATEGORIES, STATUS_LABEL, SORT_LABELS } from '@/lib/product-types'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getProducts, toProduct } from '@/lib/products-api'
import type {
  ProductStatus,
  Category,
  Product,
  SortOption,
} from '@/lib/product-types'

const STATUS_FILTERS: { value: ProductStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'SELLING', label: STATUS_LABEL.SELLING },
  { value: 'RESERVED', label: STATUS_LABEL.RESERVED },
  { value: 'SOLD', label: STATUS_LABEL.SOLD },
]

const MarketplacePage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>(
    'ALL'
  )
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | 'ALL'>(
    'ALL'
  )
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (selectedCategory !== 'ALL') params.category = selectedCategory
      if (selectedStatus !== 'ALL') params.status = selectedStatus
      if (sortBy !== 'latest') params.sort = sortBy

      const data = await getProducts(params)
      setProducts(data.map(toProduct))
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

  return (
    <div className="flex flex-col gap-4 container mx-auto md:mt-10">
      {/* 검색 + 등록 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="상품명, 설명으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-full bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
        <Link
          href="/marketplace/new"
          className="flex items-center gap-1 shrink-0 h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <IconPlus className="h-4 w-4" />
          <span className="hidden sm:inline">등록</span>
        </Link>
      </div>
      {/* 카테고리 필터 - 가로 스크롤 칩 */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            selectedCategory === 'ALL'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          전체
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 상태 필터 + 정렬 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value)}
              className={cn(
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                selectedStatus === filter.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <IconAdjustmentsHorizontal className="h-3.5 w-3.5" />
            <span>{SORT_LABELS[sortBy]}</span>
            <IconChevronDown className="h-3.5 w-3.5" />
          </button>
          {showSortDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSortDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-background border border-border rounded-lg shadow-lg py-1 min-w-30">
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSortBy(key)
                        setShowSortDropdown(false)
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors',
                        sortBy === key
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 결과 수 */}
      <p className="text-sm text-muted-foreground">
        {products.length}개의 매물
      </p>

      {/* 상품 그리드 */}
      {loading ? (
        <div className="flex justify-center py-20">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <IconSearch className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">검색 결과가 없습니다</p>
          <p className="text-xs mt-1">다른 키워드로 검색해 보세요</p>
        </div>
      )}
    </div>
  )
}

export default MarketplacePage
