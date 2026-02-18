'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { use } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconHeart,
  IconMessageCircle,
  IconEye,
  IconShare,
  IconLoader2,
  IconMapPin,
  IconClock,
  IconStar,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { STATUS_LABEL } from '@/lib/product-types';
import { cn } from '@/lib/utils';
import { getProduct, toProduct } from '@/lib/products-api';
import type { Product } from '@/lib/product-types';

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

const ProductDetailPage = ({ params }: ProductDetailPageProps) => {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getProduct(id)
      .then((data) => setProduct(toProduct(data)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !product) {
    notFound();
  }

  const isSold = product.status === 'SOLD';
  const isReserved = product.status === 'RESERVED';
  const isSelling = product.status === 'SELLING';

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-24 md:pb-8 md:mt-10">
      {/* 뒤로가기 */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/marketplace"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <IconChevronLeft className="h-4 w-4" />
          목록으로
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:gap-10">
        {/* 이미지 캐러셀 */}
        <ImageCarousel images={product.images} alt={product.title} status={product.status} />

        {/* 상품 정보 */}
        <div className="flex flex-col">
          {/* 카테고리 + 상태 뱃지 */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs font-normal">
              {product.category}
            </Badge>
            <Badge
              className={cn(
                'text-xs',
                isSelling && 'bg-[#4CAF50] text-white hover:bg-[#43A047]',
                isReserved && 'bg-[#FFC107] text-white hover:bg-[#FFB300]',
                isSold && 'bg-[#9E9E9E] text-white hover:bg-[#8E8E8E]'
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
          <p
            className={cn(
              'text-2xl md:text-3xl font-bold mb-5',
              isSold ? 'text-muted-foreground line-through' : 'text-foreground'
            )}
          >
            ${product.price.toLocaleString()}
          </p>

          {/* 통계 */}
          <div className="flex items-center gap-5 text-sm text-muted-foreground pb-5 border-b border-border">
            <span className="flex items-center gap-1.5">
              <IconEye className="h-4 w-4" />
              조회 {product.viewCount}
            </span>
            <span className="flex items-center gap-1.5">
              <IconMessageCircle className="h-4 w-4" />
              채팅 {product.chatCount}
            </span>
            <span className="flex items-center gap-1.5">
              <IconHeart className="h-4 w-4" />
              관심 {product.likeCount}
            </span>
          </div>

          {/* 판매자 정보 */}
          <div className="py-5 border-b border-border">
            <div className="flex items-center gap-3">
              {product.seller.avatarUrl ? (
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-muted ring-2 ring-background shadow-sm">
                  <Image
                    src={product.seller.avatarUrl}
                    alt={product.seller.nickname}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {product.seller.nickname[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{product.seller.nickname}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <IconStar className="h-3.5 w-3.5 text-[#FFB347] fill-[#FFB347]" />
                  <span>매너점수 {product.seller.mannerScore}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 설명 */}
          <div className="py-5 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground mb-3">상품 설명</h2>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {product.description || '등록된 상품 설명이 없습니다.'}
            </p>
          </div>

          {/* 데스크톱 액션 버튼 */}
          <div className="hidden md:flex gap-3 pt-5">
            <Button variant="outline" size="lg" className="gap-1.5" disabled={isSold}>
              <IconHeart className="h-4 w-4" />
              관심
            </Button>
            <Button variant="outline" size="lg" className="gap-1.5">
              <IconShare className="h-4 w-4" />
              공유
            </Button>
            <Button size="lg" className="flex-1 gap-1.5 bg-primary hover:bg-primary/90" disabled={isSold}>
              <IconMessageCircle className="h-4 w-4" />
              채팅하기
            </Button>
          </div>
        </div>
      </div>

      {/* 모바일 하단 고정 액션바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 flex items-center gap-3 md:hidden z-30">
        <Button variant="outline" size="icon" className="shrink-0 h-11 w-11" disabled={isSold}>
          <IconHeart className="h-5 w-5" />
        </Button>
        <div className="border-l border-border h-8 mx-1" />
        <p
          className={cn(
            'text-lg font-bold shrink-0',
            isSold ? 'text-muted-foreground line-through' : 'text-foreground'
          )}
        >
          ${product.price.toLocaleString()}
        </p>
        <Button className="flex-1 h-11 gap-1.5 bg-primary hover:bg-primary/90" disabled={isSold}>
          <IconMessageCircle className="h-4 w-4" />
          채팅하기
        </Button>
      </div>
    </div>
  );
};

/** 이미지 캐러셀 컴포넌트 */
const ImageCarousel = ({ images, alt, status }: { images: string[]; alt: string; status: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isSold = status === 'SOLD';
  const isReserved = status === 'RESERVED';
  const hasMultiple = images.length > 1;

  const goTo = (idx: number) => {
    if (idx < 0) setCurrentIndex(images.length - 1);
    else if (idx >= images.length) setCurrentIndex(0);
    else setCurrentIndex(idx);
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-muted flex items-center justify-center text-muted-foreground text-sm">
        이미지 없음
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 메인 이미지 */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted group">
        <Image
          src={images[currentIndex] ?? images[0]!}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-300"
          priority
        />

        {isReserved && (
          <span className="absolute top-3 left-3 px-3 py-1 text-sm font-medium bg-[#FFC107] text-white rounded-lg shadow-sm">
            {STATUS_LABEL.RESERVED}
          </span>
        )}
        {isSold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xl font-medium">{STATUS_LABEL.SOLD}</span>
          </div>
        )}

        {/* 좌우 화살표 */}
        {hasMultiple && (
          <>
            <button
              onClick={() => goTo(currentIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            >
              <IconChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => goTo(currentIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            >
              <IconChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* 인디케이터 dots + 카운터 */}
        {hasMultiple && (
          <>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    idx === currentIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/70'
                  )}
                />
              ))}
            </div>
            <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-medium bg-black/40 text-white rounded-full">
              {currentIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* 데스크톱 썸네일 */}
      {hasMultiple && (
        <div className="hidden md:flex gap-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'relative w-20 h-20 rounded-lg overflow-hidden bg-muted transition-all',
                idx === currentIndex ? 'ring-2 ring-primary shadow-sm' : 'opacity-50 hover:opacity-100'
              )}
            >
              <Image src={img} alt={`${alt} ${idx + 1}`} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
