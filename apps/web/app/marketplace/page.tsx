'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { IconLoader2 } from '@tabler/icons-react';
import { Header } from '@/components/layout/header';
import { ProductCard } from './components/product-card';
import { FilterBar } from './components/filter-bar';
import { checkAuth, productApi } from '@/lib/api';
import { ProductResponseDto, ProductStatus } from '@/types/api';

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 필터 상태
  const category = searchParams.get('category') || undefined;
  const status = (searchParams.get('status') as ProductStatus) || undefined;
  const search = searchParams.get('search') || undefined;
  const sort = (searchParams.get('sort') as 'latest' | 'price_asc' | 'price_desc') || 'latest';

  // 상품 로드
  const loadProducts = useCallback(
    async (isInitial = false) => {
      if (loading || (!hasMore && !isInitial)) return;
      setLoading(true);

      const { data, error } = await productApi.getProducts({
        cursor: isInitial ? undefined : cursor || undefined,
        category,
        status,
        search,
        sort,
        limit: 20,
      });

      if (data && !error) {
        setProducts((prev) => (isInitial ? data.products : [...prev, ...data.products]));
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
      setLoading(false);
      if (isInitial) setInitialLoading(false);
    },
    [cursor, hasMore, loading, category, status, search, sort]
  );

  // 찜 토글
  const handleFavoriteToggle = async (productId: string) => {
    if (!isAuthenticated) return;

    const { data } = await productApi.toggleFavorite(productId);
    if (data) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                isFavorited: data.isFavorited,
                favoriteCount: data.isFavorited ? p.favoriteCount + 1 : p.favoriteCount - 1,
              }
            : p
        )
      );
    }
  };

  // 인증 확인
  useEffect(() => {
    checkAuth().then(({ isAuthenticated }) => setIsAuthenticated(isAuthenticated));
  }, []);

  // 초기 로드 및 필터 변경 시
  useEffect(() => {
    setProducts([]);
    setCursor(null);
    setHasMore(true);
    setInitialLoading(true);
    loadProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status, search, sort]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasMore && !loading && !initialLoading) {
          loadProducts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadProducts, hasMore, loading, initialLoading]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* 페이지 제목 */}
        <h1 className="text-2xl font-bold mb-4">마켓플레이스</h1>

        {/* 필터 바 */}
        <FilterBar />

        {/* 상품 그리드 */}
        {initialLoading ? (
          <div className="flex items-center justify-center h-64">
            <IconLoader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">등록된 상품이 없습니다</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onFavoriteToggle={isAuthenticated ? handleFavoriteToggle : undefined}
                />
              ))}
            </div>

            {/* 무한 스크롤 트리거 */}
            <div ref={loadMoreRef} className="h-10 flex items-center justify-center mt-6">
              {loading && <IconLoader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
              {!hasMore && products.length > 0 && (
                <p className="text-sm text-muted-foreground">모든 상품을 불러왔습니다</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <IconLoader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
