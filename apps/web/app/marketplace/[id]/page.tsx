'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  IconChevronLeft,
  IconHeart,
  IconHeartFilled,
  IconShare,
  IconEye,
  IconMapPin,
  IconClock,
  IconMessage,
  IconLoader2,
  IconDots,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { checkAuth, productApi, chatApi } from '@/lib/api';
import { ProductResponseDto, ProductStatus, UserProfileResponseDto } from '@/types/api';

const STATUS_CONFIG = {
  SELLING: { label: '판매중', className: 'bg-[#4CAF50] text-white' },
  RESERVED: { label: '예약중', className: 'bg-[#FFC107] text-black' },
  SOLD: { label: '판매완료', className: 'bg-[#9E9E9E] text-white' },
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductResponseDto | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfileResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwner = currentUser && product && currentUser.id === product.seller.id;

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      const [productRes, authRes] = await Promise.all([productApi.getProduct(productId), checkAuth()]);

      if (productRes.data) {
        setProduct(productRes.data);
      }
      if (authRes.user) {
        setCurrentUser(authRes.user);
      }
      setLoading(false);
    };
    loadData();
  }, [productId]);

  // 찜 토글
  const handleFavoriteToggle = async () => {
    if (!currentUser || !product) return;

    const { data } = await productApi.toggleFavorite(productId);
    if (data) {
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              isFavorited: data.isFavorited,
              favoriteCount: data.isFavorited ? prev.favoriteCount + 1 : prev.favoriteCount - 1,
            }
          : null
      );
    }
  };

  // 채팅 시작
  const handleStartChat = async () => {
    if (!currentUser || !product) {
      router.push('/login');
      return;
    }

    setActionLoading(true);
    const { data, error } = await chatApi.createRoom(productId);
    setActionLoading(false);

    if (data) {
      router.push(`/chat/${data.id}`);
    } else if (error) {
      alert(error);
    }
  };

  // 상태 변경
  const handleStatusChange = async (newStatus: ProductStatus) => {
    if (!product) return;

    setActionLoading(true);
    const { data } = await productApi.updateProductStatus(productId, newStatus);
    setActionLoading(false);

    if (data) {
      setProduct((prev) => (prev ? { ...prev, status: data.status } : null));
    }
  };

  // 삭제
  const handleDelete = async () => {
    setActionLoading(true);
    const { error } = await productApi.deleteProduct(productId);
    setActionLoading(false);

    if (!error) {
      router.push('/marketplace');
    }
  };

  // 공유
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product?.title,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[50vh]">
          <IconLoader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <p className="text-muted-foreground">상품을 찾을 수 없습니다</p>
          <Link href="/marketplace">
            <Button variant="outline">목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[product.status];
  const priceDisplay = `$${(product.price / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const currentImage = product.images[currentImageIndex] || product.images[0] || '';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto">
        {/* 뒤로가기 + 액션 버튼 */}
        <div className="sticky top-14 z-40 bg-background border-b px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <IconChevronLeft className="w-5 h-5" />
            <span className="text-sm">뒤로</span>
          </button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <IconShare className="w-5 h-5" />
            </Button>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <IconDots className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/marketplace/${productId}/edit`)}>
                    <IconEdit className="w-4 h-4 mr-2" />
                    수정하기
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>상태 변경</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange('SELLING')}
                    disabled={product.status === 'SELLING'}
                  >
                    판매중으로 변경
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange('RESERVED')}
                    disabled={product.status === 'RESERVED'}
                  >
                    예약중으로 변경
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('SOLD')} disabled={product.status === 'SOLD'}>
                    판매완료로 변경
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <IconTrash className="w-4 h-4 mr-2" />
                    삭제하기
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* 이미지 갤러리 */}
        <div className="relative aspect-square bg-muted">
          {currentImage ? (
            <>
              <Image src={currentImage} alt={product.title} fill className="object-contain" priority />
              {/* 이미지 인디케이터 */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {product.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentImageIndex ? 'bg-primary' : 'bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground">이미지 없음</span>
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="px-4 py-6 space-y-6">
          {/* 판매자 정보 */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {product.seller.avatarUrl ? (
                <img
                  src={product.seller.avatarUrl}
                  alt={product.seller.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-medium text-muted-foreground">{product.seller.nickname.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="font-medium">{product.seller.nickname}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <IconMapPin className="w-3.5 h-3.5" />
                {product.seller.location}
              </p>
            </div>
          </div>

          {/* 제목 & 가격 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={status.className}>{status.label}</Badge>
              <Badge variant="outline">{product.category}</Badge>
            </div>
            <h1 className="text-xl font-bold">{product.title}</h1>
            <p className="text-2xl font-bold text-primary">{priceDisplay}</p>
          </div>

          {/* 메타 정보 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <IconClock className="w-4 h-4" />
              {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true, locale: ko })}
            </span>
            <span className="flex items-center gap-1">
              <IconEye className="w-4 h-4" />
              조회 {product.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <IconHeart className="w-4 h-4" />찜 {product.favoriteCount}
            </span>
          </div>

          {/* 설명 */}
          <div className="border-t pt-6">
            <h2 className="font-medium mb-2">상품 설명</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
          </div>

          {/* 거래 희망 장소 */}
          <div className="border-t pt-6">
            <h2 className="font-medium mb-2">거래 희망 장소</h2>
            <p className="text-muted-foreground flex items-center gap-1">
              <IconMapPin className="w-4 h-4" />
              {product.location}
            </p>
          </div>
        </div>

        {/* 하단 액션 바 */}
        {!isOwner && (
          <div className="sticky bottom-0 bg-background border-t px-4 py-3 flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={handleFavoriteToggle} disabled={!currentUser}>
              {product.isFavorited ? (
                <IconHeartFilled className="w-5 h-5 text-primary" />
              ) : (
                <IconHeart className="w-5 h-5" />
              )}
            </Button>
            <div className="flex-1">
              <p className="text-lg font-bold">{priceDisplay}</p>
            </div>
            <Button onClick={handleStartChat} disabled={actionLoading || product.status === 'SOLD'} className="px-6">
              {actionLoading ? (
                <IconLoader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <IconMessage className="w-4 h-4 mr-2" />
                  채팅하기
                </>
              )}
            </Button>
          </div>
        )}
      </main>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상품을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 상품과 관련된 모든 채팅도 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
