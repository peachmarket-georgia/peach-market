'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { ProductGrid } from '@/components/product'
import { products, CATEGORIES, STATUS_LABEL } from '@/lib/data'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ProductStatus, Category } from '@/lib/data'

type SortOption = 'latest' | 'price_asc' | 'price_desc'

const SORT_LABELS: Record<SortOption, string> = {
  latest: '최신순',
  price_asc: '낮은 가격순',
  price_desc: '높은 가격순',
}

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

  const filteredProducts = useMemo(() => {
    let result = [...products]

    // 검색
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      )
    }

    // 카테고리 필터
    if (selectedCategory !== 'ALL') {
      result = result.filter((p) => p.category === selectedCategory)
    }

    // 상태 필터
    if (selectedStatus !== 'ALL') {
      result = result.filter((p) => p.status === selectedStatus)
    }

    // 정렬
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'latest':
      default:
        break
    }

    return result
  }, [searchQuery, selectedCategory, selectedStatus, sortBy])

  return (
    <div className="flex flex-col gap-4">
      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="상품명, 설명으로 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 rounded-full bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
        />
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
        {/* 상태 탭 */}
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

        {/* 정렬 드롭다운 */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{SORT_LABELS[sortBy]}</span>
            <ChevronDown className="h-3.5 w-3.5" />
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
        {filteredProducts.length}개의 매물
      </p>

      {/* 상품 그리드 */}
      {filteredProducts.length > 0 ? (
        <ProductGrid products={filteredProducts} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">검색 결과가 없습니다</p>
          <p className="text-xs mt-1">다른 키워드로 검색해 보세요</p>
        </div>
      )}
    </div>
  )
}

export default MarketplacePage
