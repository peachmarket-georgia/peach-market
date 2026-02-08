/**
 * 🍑 피치마켓 홈 피드
 *
 * 조지아 한인 중고거래 플랫폼의 메인 페이지입니다.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const HomePage = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-accent to-background">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 bg-card shadow-sm">
        <h1 className="text-xl font-bold text-primary">🍑 피치마켓</h1>
        <span className="text-sm text-muted-foreground">둘루스, GA</span>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="px-4 py-6 pb-24">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          주변 매물
        </h2>

        {/* 상품 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 샘플 상품 카드 1 */}
          <Card className="overflow-hidden">
            <Skeleton className="h-32 rounded-none" />
            <CardContent className="p-3">
              <Badge variant="default" className="mb-2">
                판매중
              </Badge>
              <p className="text-sm font-medium text-card-foreground truncate">
                샘플 상품
              </p>
              <p className="text-sm font-bold text-primary">$50</p>
            </CardContent>
          </Card>

          {/* 샘플 상품 카드 2 */}
          <Card className="overflow-hidden">
            <Skeleton className="h-32 rounded-none" />
            <CardContent className="p-3">
              <Badge variant="secondary" className="mb-2">
                예약중
              </Badge>
              <p className="text-sm font-medium text-card-foreground truncate">
                샘플 상품 2
              </p>
              <p className="text-sm font-bold text-primary">$30</p>
            </CardContent>
          </Card>

          {/* 샘플 상품 카드 3 */}
          <Card className="overflow-hidden">
            <Skeleton className="h-32 rounded-none" />
            <CardContent className="p-3">
              <Badge variant="outline" className="mb-2">
                판매완료
              </Badge>
              <p className="text-sm font-medium text-card-foreground truncate">
                샘플 상품 3
              </p>
              <p className="text-sm font-bold text-muted-foreground line-through">$25</p>
            </CardContent>
          </Card>

          {/* 샘플 상품 카드 4 */}
          <Card className="overflow-hidden">
            <Skeleton className="h-32 rounded-none" />
            <CardContent className="p-3">
              <Badge variant="default" className="mb-2">
                판매중
              </Badge>
              <p className="text-sm font-medium text-card-foreground truncate">
                샘플 상품 4
              </p>
              <p className="text-sm font-bold text-primary">$100</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 플로팅 버튼 */}
      <Button
        size="lg"
        className="fixed w-14 h-14 text-2xl rounded-full shadow-lg bottom-20 right-4"
      >
        +
      </Button>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around py-3 bg-card border-t border-border">
        <button className="flex flex-col items-center text-primary">
          <span className="text-xl">🏠</span>
          <span className="text-xs">홈</span>
        </button>
        <button className="flex flex-col items-center text-muted-foreground">
          <span className="text-xl">🔍</span>
          <span className="text-xs">검색</span>
        </button>
        <button className="flex flex-col items-center text-muted-foreground">
          <span className="text-xl">💬</span>
          <span className="text-xs">채팅</span>
        </button>
        <button className="flex flex-col items-center text-muted-foreground">
          <span className="text-xl">❤️</span>
          <span className="text-xs">관심</span>
        </button>
        <button className="flex flex-col items-center text-muted-foreground">
          <span className="text-xl">👤</span>
          <span className="text-xs">MY</span>
        </button>
      </nav>
    </main>
  );
};

export default HomePage;
