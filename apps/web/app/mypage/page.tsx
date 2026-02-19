'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  IconLoader2,
  IconMapPin,
  IconCalendar,
  IconEdit,
  IconHeart,
  IconPackage,
  IconCheck,
} from '@tabler/icons-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ProductCard } from '@/app/marketplace/components/product-card';
import { checkAuth, userApi } from '@/lib/api';
import { productApi } from '@/lib/products-api';
import { ProductResponseDto, UserProfileResponseDto } from '@/types/api';

type TabType = 'selling' | 'sold' | 'favorites';

const TAB_CONFIG: { id: TabType; label: string; icon: typeof IconPackage }[] = [
  { id: 'selling', label: '판매중', icon: IconPackage },
  { id: 'sold', label: '판매완료', icon: IconCheck },
  { id: 'favorites', label: '찜 목록', icon: IconHeart },
];

export default function MyPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfileResponseDto | null>(null);
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('selling');
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  // 프로필 수정 상태
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // 인증 및 유저 정보 로드
  useEffect(() => {
    const loadData = async () => {
      const { isAuthenticated, user: userData } = await checkAuth();

      if (!isAuthenticated || !userData) {
        router.push('/login');
        return;
      }

      setUser(userData);
      setLoading(false);
    };

    loadData();
  }, [router]);

  // 탭별 상품 로드
  useEffect(() => {
    if (!user) return;

    const loadProducts = async () => {
      setProductsLoading(true);

      let result: { data?: ProductResponseDto[]; error?: string };

      switch (activeTab) {
        case 'selling':
          result = await productApi.getMyProducts('SELLING');
          break;
        case 'sold':
          result = await productApi.getMyProducts('SOLD');
          break;
        case 'favorites':
          result = await productApi.getFavorites();
          break;
      }

      if (result.data) {
        setProducts(result.data);
      }

      setProductsLoading(false);
    };

    loadProducts();
  }, [user, activeTab]);

  // 찜 토글
  const handleFavoriteToggle = async (productId: string) => {
    const { data } = await productApi.toggleFavorite(productId);
    if (data) {
      if (activeTab === 'favorites') {
        // 찜 목록에서는 찜 해제 시 목록에서 제거
        if (!data.isFavorited) {
          setProducts((prev) => prev.filter((p) => p.id !== productId));
        }
      } else {
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
    }
  };

  // 프로필 수정 다이얼로그 열기
  const openEditDialog = () => {
    if (user) {
      setEditNickname(user.nickname);
      setEditLocation(user.location);
      setEditError(null);
      setShowEditDialog(true);
    }
  };

  // 프로필 수정 제출
  const handleEditSubmit = async () => {
    if (!editNickname.trim() || !editLocation.trim()) {
      setEditError('닉네임과 지역을 모두 입력해주세요.');
      return;
    }

    setEditLoading(true);
    setEditError(null);

    const { data, error } = await userApi.updateProfile({
      nickname: editNickname.trim(),
      location: editLocation.trim(),
    });

    setEditLoading(false);

    if (error) {
      setEditError(error);
      return;
    }

    if (data) {
      setUser(data);
      setShowEditDialog(false);
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* 프로필 섹션 */}
        <section className="bg-card rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            {/* 아바타 */}
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-medium text-muted-foreground">{user.nickname.charAt(0)}</span>
              )}
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{user.nickname}</h1>
              <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-1">
                  <IconMapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{user.location}</span>
                </p>
                <p className="flex items-center gap-1">
                  <IconCalendar className="w-4 h-4 shrink-0" />
                  <span>{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: ko })} 가입</span>
                </p>
              </div>
            </div>

            {/* 수정 버튼 */}
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <IconEdit className="w-4 h-4 mr-1" />
              수정
            </Button>
          </div>
        </section>

        {/* 탭 */}
        <div className="flex border-b mb-6">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 상품 목록 */}
        {productsLoading ? (
          <div className="flex items-center justify-center h-40">
            <IconLoader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              {activeTab === 'selling' && '판매중인 상품이 없습니다'}
              {activeTab === 'sold' && '판매완료된 상품이 없습니다'}
              {activeTab === 'favorites' && '찜한 상품이 없습니다'}
            </p>
            {activeTab === 'selling' && (
              <Link href="/marketplace/new">
                <Button>상품 등록하기</Button>
              </Link>
            )}
            {activeTab === 'favorites' && (
              <Link href="/marketplace">
                <Button variant="outline">마켓플레이스 둘러보기</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onFavoriteToggle={handleFavoriteToggle} />
            ))}
          </div>
        )}
      </main>

      {/* 프로필 수정 다이얼로그 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로필 수정</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editError && (
              <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
                {editError}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium">
                닉네임
              </label>
              <Input
                id="nickname"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                placeholder="닉네임을 입력해주세요"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                지역
              </label>
              <Input
                id="location"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="예: Duluth, GA"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={editLoading}>
              취소
            </Button>
            <Button onClick={handleEditSubmit} disabled={editLoading}>
              {editLoading ? (
                <>
                  <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
