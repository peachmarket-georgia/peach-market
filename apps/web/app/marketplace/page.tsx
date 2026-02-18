'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  IconSearch,
  IconAdjustmentsHorizontal,
  IconChevronDown,
  IconLoader2,
  IconPlus,
  IconPackage,
} from '@tabler/icons-react';
import { ProductGrid } from '@/components/product';
import { CATEGORIES, STATUS_LABEL, SORT_LABELS } from '@/lib/product-types';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getProducts, toProduct } from '@/lib/products-api';
import type { ProductStatus, Category, Product, SortOption } from '@/lib/product-types';

const STATUS_FILTERS: { value: ProductStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'SELLING', label: STATUS_LABEL.SELLING },
  { value: 'RESERVED', label: STATUS_LABEL.RESERVED },
  { value: 'SOLD', label: STATUS_LABEL.SOLD },
];

const MarketplacePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (sortBy !== 'latest') params.sort = sortBy;

      const data = await getProducts(params);
      setProducts(data.map(toProduct));
    } catch (e) {
      console.error('Failed to fetch products:', e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedStatus, sortBy]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  return (
    <div className="flex flex-col gap-4 container mx-auto px-4 md:px-6 md:mt-10">
      {/* 헤딩 */}
      <div className="mb-1">
        <h1 className="text-2xl font-extrabold text-[#212121]">중고거래</h1>
        <p className="text-sm text-[#9E9E9E] mt-0.5">조지아 한인 중고마켓 🍑</p>
      </div>

      {/* 검색 + 등록 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
          <Input
            placeholder="상품명, 설명으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-full bg-white border-2 border-orange-100 focus-visible:ring-0 focus-visible:border-primary shadow-sm placeholder:text-[#9E9E9E] text-[#212121] transition-colors"
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

      {/* 카테고리 필터 */}
      <div className="-mx-4 md:-mx-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-4 md:px-6 pb-1 w-max">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={cn(
              'shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
              selectedCategory === 'ALL'
                ? 'bg-primary text-white shadow-md shadow-primary/30'
                : 'bg-white border-2 border-orange-100 text-[#757575] hover:border-primary/40 hover:text-primary'
            )}
          >
            전체
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'bg-white border-2 border-orange-100 text-[#757575] hover:border-primary/40 hover:text-primary'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 상태 필터 + 정렬 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                selectedStatus === filter.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-[#757575] hover:text-[#212121] hover:bg-orange-50'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-1 text-sm font-medium text-[#757575] hover:text-primary transition-colors"
          >
            <IconAdjustmentsHorizontal className="h-3.5 w-3.5" />
            <span>{SORT_LABELS[sortBy]}</span>
            <IconChevronDown className={cn('h-3.5 w-3.5 transition-transform', showSortDropdown && 'rotate-180')} />
          </button>
          {showSortDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
              <div className="absolute right-0 top-full mt-2 z-20 bg-white border-2 border-orange-100 rounded-xl shadow-xl py-1.5 min-w-32 overflow-hidden">
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSortBy(key);
                      setShowSortDropdown(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm transition-colors',
                      sortBy === key
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-[#757575] hover:bg-orange-50 hover:text-[#212121]'
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
      {!loading && (
        <p className="text-sm font-medium text-[#757575]">
          <span className="text-primary font-bold">{products.length}</span>개의 매물
        </p>
      )}

      {/* 상품 그리드 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-[#757575]">상품을 불러오는 중...</p>
        </div>
      ) : products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <IconPackage className="h-10 w-10 text-primary/50" />
          </div>
          <p className="text-base font-semibold text-[#212121]">검색 결과가 없어요</p>
          <p className="text-sm text-[#757575]">다른 키워드로 검색해 보세요</p>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
