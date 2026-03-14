'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  IconLoader2,
  IconMapPin,
  IconCalendar,
  IconEdit,
  IconHeart,
  IconPackage,
  IconCheck,
  IconShoppingBag,
  IconBell,
  IconBellOff,
  IconCurrentLocation,
  IconExternalLink,
} from '@tabler/icons-react'
import { usePushNotification } from '@/hooks/use-push-notification'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ProductCard } from '@/app/marketplace/components/product-card'
import { checkAuth, userApi } from '@/lib/api'
import { useGeolocation } from '@/hooks/use-geolocation'
import { RadiusMap } from '@/components/radius-map'
import { ProductResponseDto, UserProfileResponseDto } from '@/types/api'
import { productApi } from '@/lib/products-api'
import { reservationApi } from '@/lib/reservation-api'
import type { ReservationDto } from '@/types/reservation'

const MILES_TO_KM = 1.60934

type TabType = 'selling' | 'sold' | 'purchased' | 'favorites'

const TAB_CONFIG: { id: TabType; label: string; icon: typeof IconPackage }[] = [
  { id: 'selling', label: '판매중', icon: IconPackage },
  { id: 'sold', label: '판매완료', icon: IconCheck },
  { id: 'purchased', label: '구매완료', icon: IconShoppingBag },
  { id: 'favorites', label: '찜 목록', icon: IconHeart },
]

export default function MyPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserProfileResponseDto | null>(null)
  const [products, setProducts] = useState<ProductResponseDto[]>([])
  const [purchasedReservations, setPurchasedReservations] = useState<ReservationDto[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('selling')
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)

  const { permission, isSubscribed, isSupported, subscribe, unsubscribe } = usePushNotification()
  const [optimisticSubscribed, setOptimisticSubscribed] = useState<boolean | null>(null)
  const [pushLoading, setPushLoading] = useState(false)
  const [showPushBlockedDialog, setShowPushBlockedDialog] = useState(false)

  const displaySubscribed = optimisticSubscribed ?? isSubscribed

  // 프로필 수정 상태
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const { loading: locationLoading, error: locationError, getLocation } = useGeolocation()

  const [distanceUnit, setDistanceUnit] = useState<'miles' | 'km'>('miles')

  // 반경 설정 상태
  const [savedRadiusMiles, setSavedRadiusMiles] = useState(0)
  const [tempRadiusMiles, setTempRadiusMiles] = useState(0)
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)

  useEffect(() => {
    const savedUnit = localStorage.getItem('distance-unit')
    if (savedUnit === 'miles' || savedUnit === 'km') setDistanceUnit(savedUnit)

    const savedRadius = localStorage.getItem('distance-radius-miles')
    const savedLat = localStorage.getItem('user-location-lat')
    const savedLng = localStorage.getItem('user-location-lng')

    const miles = savedRadius ? Number(savedRadius) : 0
    setSavedRadiusMiles(miles)
    setTempRadiusMiles(miles)

    if (savedLat && savedLng) {
      setUserLat(Number(savedLat))
      setUserLng(Number(savedLng))
    }
  }, [])

  const handleDistanceUnitChange = (unit: 'miles' | 'km') => {
    setDistanceUnit(unit)
    localStorage.setItem('distance-unit', unit)
  }

  const handleGetLocation = async () => {
    const result = await getLocation()
    if (result) setEditLocation(result.formatted)
  }

  const handleGetMyLocation = async () => {
    const result = await getLocation()
    if (result) {
      setUserLat(result.lat)
      setUserLng(result.lng)
      localStorage.setItem('user-location-lat', String(result.lat))
      localStorage.setItem('user-location-lng', String(result.lng))
    }
  }

  const handleRadiusConfirm = () => {
    setSavedRadiusMiles(tempRadiusMiles)
    localStorage.setItem('distance-radius-miles', String(tempRadiusMiles))
  }

  const radiusLabel =
    tempRadiusMiles === 0
      ? '전체 보기'
      : distanceUnit === 'miles'
        ? `반경 ${tempRadiusMiles}mi 이내`
        : `반경 ${(tempRadiusMiles * MILES_TO_KM).toFixed(1)}km 이내`

  // 인증 및 유저 정보 로드
  useEffect(() => {
    const loadData = async () => {
      const { isAuthenticated, user: userData } = await checkAuth()

      if (!isAuthenticated || !userData) {
        router.push('/login')
        return
      }

      setUser(userData)
      setLoading(false)
    }

    loadData()
  }, [router])

  // 탭별 상품 로드
  useEffect(() => {
    if (!user) return

    const loadProducts = async () => {
      setProductsLoading(true)

      if (activeTab === 'purchased') {
        const { data } = await reservationApi.getMy('buyer')
        setPurchasedReservations(data ? data.filter((r) => r.status === 'CONFIRMED') : [])
      } else {
        let result: { data?: ProductResponseDto[]; error?: string }

        switch (activeTab) {
          case 'selling':
            result = await productApi.getMyProducts('SELLING')
            break
          case 'sold':
            result = await productApi.getMyProducts('CONFIRMED')
            break
          case 'favorites':
            result = await productApi.getFavorites()
            break
        }

        if (result!.data) setProducts(result!.data)
        else setProducts([])
      }

      setProductsLoading(false)
    }

    loadProducts()
  }, [user, activeTab])

  // 찜 토글
  const handleFavoriteToggle = async (productId: string) => {
    const { data } = await productApi.toggleFavorite(productId)
    if (data) {
      if (activeTab === 'favorites') {
        if (!data.isFavorited) {
          setProducts((prev) => prev.filter((p) => p.id !== productId))
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
        )
      }
    }
  }

  // 프로필 수정 다이얼로그 열기
  const openEditDialog = () => {
    if (user) {
      setEditNickname(user.nickname)
      setEditLocation(user.location)
      setEditError(null)
      setShowEditDialog(true)
    }
  }

  // 프로필 수정 제출
  const handleEditSubmit = async () => {
    if (!editNickname.trim() || !editLocation.trim()) {
      setEditError('닉네임과 지역을 모두 입력해주세요.')
      return
    }

    setEditLoading(true)
    setEditError(null)

    const { data, error } = await userApi.updateProfile({
      nickname: editNickname.trim(),
      location: editLocation.trim(),
    })

    setEditLoading(false)

    if (error) {
      setEditError(error)
      return
    }

    if (data) {
      setUser(data)
      setShowEditDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[50vh]">
          <IconLoader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const staticMapUrl =
    apiKey && user.location
      ? `https://maps.googleapis.com/maps/api/staticmap` +
        `?center=${encodeURIComponent(user.location)}` +
        `&zoom=13&size=600x500&scale=2` +
        `&markers=color:0xFF6B35|${encodeURIComponent(user.location)}` +
        `&style=feature:poi|visibility:off` +
        `&style=feature:transit|visibility:off` +
        `&key=${apiKey}`
      : null
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(user.location)}`

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

        {/* 위치 지도 + 반경 설정 */}
        <section className="bg-card rounded-2xl overflow-hidden shadow-sm mb-6">
          {/* 지도 위쪽 UI */}
          <div className="px-4 pt-4 pb-3 space-y-3">
            {/* 위치 레이블 + GPS 활성화 */}
            <div className="flex items-center gap-2">
              <IconMapPin className="w-5 h-5 text-primary shrink-0" />
              <span className="text-base font-semibold flex-1 truncate">{user.location}</span>
              <button
                onClick={handleGetMyLocation}
                disabled={locationLoading}
                className="flex items-center gap-1.5 text-sm text-primary font-semibold shrink-0 disabled:opacity-50"
              >
                {locationLoading ? (
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <IconCurrentLocation className="w-4 h-4" />
                )}
                {userLat != null ? '위치 새로고침' : '내 위치 활성화'}
              </button>
            </div>

            {/* 현재 설정된 반경 표시 */}
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold">검색 반경</p>
              <span className={`text-base font-bold ${tempRadiusMiles > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                {radiusLabel}
              </span>
            </div>
          </div>

          {/* 지도 영역 */}
          {userLat != null && userLng != null ? (
            <RadiusMap
              lat={userLat}
              lng={userLng}
              radiusKm={tempRadiusMiles > 0 ? tempRadiusMiles * MILES_TO_KM : 8}
              className="w-full h-[40rem]"
            />
          ) : staticMapUrl ? (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={staticMapUrl}
                alt={`${user.location} 지도`}
                className="w-full h-[40rem] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow">
                  <IconExternalLink className="w-3.5 h-3.5" />
                  Google Maps에서 보기
                </span>
              </div>
            </a>
          ) : null}

          {/* 하단: 슬라이더 + 확인 버튼 */}
          <div className="px-4 py-4 space-y-4">
            {/* 반경 슬라이더 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>거리무관</span>
                <span>{distanceUnit === 'miles' ? '30mi' : `${(30 * MILES_TO_KM).toFixed(0)}km`}</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={tempRadiusMiles}
                onChange={(e) => setTempRadiusMiles(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
              />
              {tempRadiusMiles > 0 && userLat == null && (
                <p className="text-sm text-muted-foreground">반경 필터를 적용하려면 내 위치를 활성화해주세요</p>
              )}
            </div>

            {/* 확인 버튼 */}
            <Button onClick={handleRadiusConfirm} className="w-full" disabled={tempRadiusMiles === savedRadiusMiles}>
              확인
            </Button>
          </div>
        </section>

        {/* 알림 설정 */}
        {isSupported && (
          <section
            className={`bg-card rounded-2xl px-6 py-4 mb-6 shadow-sm flex items-center justify-between gap-4 ${
              permission !== 'denied' ? 'cursor-pointer active:opacity-70' : ''
            }`}
            onClick={async () => {
              if (permission === 'denied') {
                setShowPushBlockedDialog(true)
                return
              }
              if (pushLoading) return
              const next = !displaySubscribed
              setOptimisticSubscribed(next)
              setPushLoading(true)
              const ok = next ? await subscribe() : (await unsubscribe(), true)
              if (!ok) setOptimisticSubscribed(!next)
              setOptimisticSubscribed(null)
              setPushLoading(false)
            }}
          >
            <div className="flex items-center gap-3">
              {displaySubscribed ? (
                <IconBell className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <IconBellOff className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium">채팅 알림</p>
                <p className="text-xs text-muted-foreground">
                  {permission === 'denied'
                    ? '브라우저 설정에서 알림을 허용해주세요'
                    : displaySubscribed
                      ? '새 메시지 알림이 활성화되어 있습니다'
                      : '새 메시지를 받으면 알림을 보내드립니다'}
                </p>
              </div>
            </div>

            {permission === 'denied' ? (
              <span className="shrink-0 text-xs text-primary underline underline-offset-2">허용하기</span>
            ) : (
              <div
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                  displaySubscribed ? 'bg-primary' : 'bg-muted'
                } ${pushLoading ? 'opacity-50' : ''}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    displaySubscribed ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            )}
          </section>
        )}

        {/* 거리 단위 설정 */}
        <section className="bg-card rounded-2xl px-6 py-4 mb-6 shadow-sm flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">거리 단위</p>
            <p className="text-xs text-muted-foreground">마켓플레이스 반경 필터에 적용됩니다</p>
          </div>
          <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
            <button
              onClick={() => handleDistanceUnitChange('miles')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                distanceUnit === 'miles' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              mi
            </button>
            <button
              onClick={() => handleDistanceUnitChange('km')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                distanceUnit === 'km' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              km
            </button>
          </div>
        </section>

        {/* 탭 */}
        <div className="flex border-b mb-6">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
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
            )
          })}
        </div>

        {/* 상품 목록 */}
        {productsLoading ? (
          <div className="flex items-center justify-center h-40">
            <IconLoader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeTab === 'purchased' ? (
          purchasedReservations.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">구매완료한 상품이 없습니다</p>
              <Link href="/marketplace">
                <Button variant="outline">마켓플레이스 둘러보기</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {purchasedReservations.map((res) => (
                <Link key={res.id} href={`/marketplace/${res.product.id}`}>
                  <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="aspect-square overflow-hidden bg-muted relative">
                      {res.product.images[0] ? (
                        <Image
                          src={res.product.images[0]}
                          alt={res.product.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#F3E8FF] text-[#6B21A8]">
                        구매완료
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{res.product.title}</p>
                      <p className="text-sm font-bold text-primary">${res.product.price.toLocaleString('en-US')}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">판매자: {res.seller.nickname}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
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

      {/* 알림 차단 해제 안내 다이얼로그 */}
      <Dialog open={showPushBlockedDialog} onOpenChange={setShowPushBlockedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>알림 허용 방법</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4 text-sm text-muted-foreground">
            <p>브라우저에서 알림을 차단했습니다. 아래 방법으로 다시 허용할 수 있습니다.</p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <p>
                  주소창 왼쪽 <strong className="text-foreground">자물쇠 🔒 아이콘</strong>을 클릭하세요
                </p>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <p>
                  <strong className="text-foreground">알림</strong> 항목을{' '}
                  <strong className="text-foreground">허용</strong>으로 변경하세요
                </p>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <p>
                  페이지를 <strong className="text-foreground">새로고침</strong>하면 적용됩니다
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPushBlockedDialog(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <div className="flex gap-2">
                <Input
                  id="location"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="예: Duluth, GA"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGetLocation}
                  disabled={locationLoading}
                  title="현재 위치 가져오기"
                  className="shrink-0"
                >
                  {locationLoading ? (
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <IconCurrentLocation className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {locationError && <p className="text-xs text-destructive">{locationError}</p>}
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
  )
}
