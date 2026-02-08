/**
 * 상품 상세 페이지
 */

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getProductById } from "@/lib/data";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

const ProductDetailPage = async ({ params }: ProductDetailPageProps) => {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  const isSold = product.status === "판매완료";
  const isReserved = product.status === "예약중";

  return (
    <div className="max-w-4xl mx-auto">
      {/* 뒤로가기 */}
      <div className="mb-4">
        <Link
          href="/marketplace"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 목록으로
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 이미지 갤러리 */}
        <div className="space-y-3">
          {/* 메인 이미지 */}
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            <Image
              src={product.images[0] || product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            {isReserved && (
              <span className="absolute top-3 left-3 px-3 py-1 text-sm font-medium bg-black/70 text-white rounded">
                예약중
              </span>
            )}
            {isSold && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-xl font-medium">판매완료</span>
              </div>
            )}
          </div>

          {/* 썸네일 */}
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted"
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div>
          {/* 제목 */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {product.name}
          </h1>

          {/* 위치 · 시간 */}
          <p className="text-sm text-muted-foreground mb-4">
            {product.location} · {product.timeAgo}
          </p>

          {/* 가격 */}
          <p
            className={`text-2xl font-bold mb-6 ${
              isSold ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {product.price.toLocaleString()}원
          </p>

          {/* 통계 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span>조회 {product.viewCount}</span>
            <span>채팅 {product.chatCount}</span>
            <span>관심 {product.likeCount}</span>
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
                  src={product.seller.profileImage}
                  alt={product.seller.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {product.seller.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  ★ {product.seller.rating} · 거래후기{" "}
                  {product.seller.reviewCount}개
                </p>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" disabled={isSold}>
              ♡ 관심
            </Button>
            <Button className="flex-1" disabled={isSold}>
              채팅하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
