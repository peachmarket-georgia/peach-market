'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import imageCompression from 'browser-image-compression'
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
  IconMaximize,
  IconCamera,
} from '@tabler/icons-react'
import { usePushNotification } from '@/hooks/use-push-notification'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ProductCard } from '@/app/marketplace/components/product-card'
import { checkAuth, userApi, uploadApi } from '@/lib/api'
import { useGeolocation } from '@/hooks/use-geolocation'
import { RadiusMap } from '@/components/radius-map'
import { cn } from '@/lib/utils'
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

  const [showMapModal, setShowMapModal] = useState(false)
  const [sliderMiles, setSliderMiles] = useState(0)
  const [sliderMilesTemp, setSliderMilesTemp] = useState(0)
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [showLocationConfirm, setShowLocationConfirm] = useState(false)
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number; formatted: string } | null>(null)

  // 프로필 수정 상태
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarCompressing, setAvatarCompressing] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const { loading: locationLoading, error: locationError, getLocation } = useGeolocation()

  const [distanceUnit, setDistanceUnit] = useState<'miles' | 'km'>('miles')

  useEffect(() => {
    const saved = localStorage.getItem('distance-unit')
    if (saved === 'miles' || saved === 'km') setDistanceUnit(saved)
  }, [])

  const handleDistanceUnitChange = (unit: 'miles' | 'km') => {
    setDistanceUnit(unit)
    localStorage.setItem('distance-unit', unit)
  }

  const handleGetLocation = async () => {
    const result = await getLocation()
    if (result) setEditLocation(result.formatted)
  }

  // 인증 및 유저 정보 로드
  useEffect(() => {
    const loadData = async () => {
      const { isAuthenticated, user: userData } = await checkAuth()

      if (!isAuthenticated || !userData) {
        router.push('/login')
        return
      }

      setUser(userData)
      if (userData.lat != null) setUserLat(userData.lat)
      if (userData.lng != null) setUserLng(userData.lng)
      if (userData.searchRadiusMiles != null) setSliderMiles(userData.searchRadiusMiles)
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

  // 내 위치 확인 버튼
  const handleGetMyLocation = async () => {
    const result = await getLocation()
    if (result) {
      setPendingLocation({ lat: result.lat, lng: result.lng, formatted: result.formatted })
      setShowLocationConfirm(true)
    }
  }

  // 위치 설정 확인
  const handleLocationConfirm = async () => {
    if (!pendingLocation) return
    setUserLat(pendingLocation.lat)
    setUserLng(pendingLocation.lng)
    await userApi.updateProfile({ lat: pendingLocation.lat, lng: pendingLocation.lng })
    setShowLocationConfirm(false)
    setPendingLocation(null)
  }

  // 마이페이지 슬라이더 저장 버튼
  const handlePageSliderCommit = async (miles: number) => {
    if (miles === 0) {
      userApi.updateProfile({ searchRadiusMiles: 0 })
      return
    }
    if (userLat == null || userLng == null) {
      const result = await getLocation()
      if (!result) {
        setSliderMiles(0)
        return
      }
      setUserLat(result.lat)
      setUserLng(result.lng)
      userApi.updateProfile({ lat: result.lat, lng: result.lng, searchRadiusMiles: miles })
    } else {
      userApi.updateProfile({ searchRadiusMiles: miles })
    }
  }

  // 반경 확인 버튼
  const handleRadiusConfirm = async () => {
    if (sliderMilesTemp > 0 && (userLat == null || userLng == null)) {
      const result = await getLocation()
      if (!result) {
        setSliderMilesTemp(0)
        return
      }
      setUserLat(result.lat)
      setUserLng(result.lng)
      await userApi.updateProfile({ lat: result.lat, lng: result.lng, searchRadiusMiles: sliderMilesTemp })
    } else {
      await userApi.updateProfile({ searchRadiusMiles: sliderMilesTemp })
    }
    setSliderMiles(sliderMilesTemp)
    setShowMapModal(false)
  }

  // 프로필 수정 다이얼로그 열기
  const openEditDialog = () => {
    if (user) {
      setEditNickname(user.nickname)
      setEditLocation(user.location)
      setAvatarFile(null)
      setAvatarPreview(null)
      setEditError(null)
      setShowEditDialog(true)
    }
  }

  // 아바타 파일 선택 핸들러
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setEditError('JPG, PNG, WebP 형식의 이미지만 업로드 가능합니다.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setEditError('이미지 크기는 10MB 이하여야 합니다.')
      return
    }

    setAvatarCompressing(true)
    setEditError(null)

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.85,
      })
      setAvatarFile(compressed)
      setAvatarPreview(URL.createObjectURL(compressed))
    } catch {
      setEditError('이미지 처리 중 오류가 발생했습니다.')
    } finally {
      setAvatarCompressing(false)
    }

    // input 초기화 (같은 파일 재선택 허용)
    e.target.value = ''
  }

  // 프로필 수정 제출
  const handleEditSubmit = async () => {
    if (!editNickname.trim() || !editLocation.trim()) {
      setEditError('닉네임과 지역을 모두 입력해주세요.')
      return
    }

    setEditLoading(true)
    setEditError(null)

    // 아바타 이미지 업로드
    let avatarUrl: string | undefined
    if (avatarFile) {
      const { data: uploadData, error: uploadError } = await uploadApi.uploadImages([avatarFile])
      if (uploadError || !uploadData) {
        setEditError(uploadError || '이미지 업로드에 실패했습니다.')
        setEditLoading(false)
        return
      }
      avatarUrl = uploadData.images[0].url
    }

    const { data, error } = await userApi.updateProfile({
      nickname: editNickname.trim(),
      location: editLocation.trim(),
      ...(avatarUrl && { avatarUrl }),
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

        {/* 위치 및 반경 설정 */}
        <section className="bg-card rounded-2xl p-6 mb-6 shadow-sm">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium">내 주변 상품 보기</p>
              <p className="text-xs text-muted-foreground">마켓플레이스 반경 필터에 적용됩니다</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleGetMyLocation} disabled={locationLoading}>
              {locationLoading ? (
                <IconLoader2 className="w-4 h-4 animate-spin" />
              ) : (
                <IconCurrentLocation className="w-4 h-4" />
              )}
              <span className="ml-1">내 위치 확인</span>
            </Button>
          </div>

          {/* 지도 썸네일 */}
          {(() => {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            if (!apiKey || !user.location) return null
            const encoded = encodeURIComponent(user.location)
            const staticMapUrl =
              `https://maps.googleapis.com/maps/api/staticmap` +
              `?center=${encoded}&zoom=13&size=600x300&scale=2` +
              `&markers=color:0xFF6B35|${encoded}` +
              `&style=feature:poi|visibility:off` +
              `&style=feature:transit|visibility:off` +
              `&key=${apiKey}`
            return (
              <div
                className="rounded-xl overflow-hidden mb-4 cursor-pointer relative group"
                onClick={() => {
                  setSliderMilesTemp(sliderMiles)
                  setShowMapModal(true)
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={staticMapUrl}
                  alt={`${user.location} 지도`}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow">
                    <IconMaximize className="w-3.5 h-3.5" />
                    지도 확대
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center gap-2 bg-muted/30">
                  <IconMapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">{user.location}</span>
                </div>
              </div>
            )
          })()}

          {/* 반경 슬라이더 */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">거리무관</span>
              <span className={cn('text-sm font-bold', sliderMiles > 0 ? 'text-primary' : 'text-muted-foreground')}>
                {sliderMiles === 0
                  ? '전체 보기'
                  : distanceUnit === 'miles'
                    ? `반경 ${sliderMiles}mi 이내`
                    : `반경 ${(sliderMiles * MILES_TO_KM).toFixed(1)}km 이내`}
              </span>
              <span className="text-sm text-muted-foreground">
                {distanceUnit === 'miles' ? '30mi' : `${(30 * MILES_TO_KM).toFixed(0)}km`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={sliderMiles}
              onChange={(e) => setSliderMiles(Number(e.target.value))}
              disabled={locationLoading}
              className="w-full h-1 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed"
              style={{
                accentColor: '#FF6B35',
                background: `linear-gradient(to right, #FF6B35 ${(sliderMiles / 30) * 100}%, #FFE0D0 ${(sliderMiles / 30) * 100}%)`,
              }}
            />
          </div>

          {/* 저장 버튼 */}
          <Button
            className="w-full mt-4"
            onClick={() => handlePageSliderCommit(sliderMiles)}
            disabled={locationLoading}
          >
            {locationLoading && <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />}
            저장
          </Button>
        </section>

        {/* 반경 지도 모달 */}
        <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
          <DialogContent className="sm:max-w-5xl p-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <IconCurrentLocation className="h-5 w-5 text-primary" />내 주변 반경 설정
              </DialogTitle>
            </DialogHeader>
            {userLat != null && userLng != null ? (
              <div className="space-y-4">
                <RadiusMap
                  lat={userLat}
                  lng={userLng}
                  radiusKm={sliderMilesTemp > 0 ? sliderMilesTemp * MILES_TO_KM : 8}
                  className="w-full h-[640px] rounded-xl"
                />
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">거리무관</span>
                    <span
                      className={cn(
                        'text-sm font-bold',
                        sliderMilesTemp > 0 ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {sliderMilesTemp === 0
                        ? '전체 보기'
                        : distanceUnit === 'miles'
                          ? `반경 ${sliderMilesTemp}mi 이내`
                          : `반경 ${(sliderMilesTemp * MILES_TO_KM).toFixed(1)}km 이내`}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {distanceUnit === 'miles' ? '30mi' : `${(30 * MILES_TO_KM).toFixed(0)}km`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    step={1}
                    value={sliderMilesTemp}
                    onChange={(e) => setSliderMilesTemp(Number(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer"
                    style={{
                      accentColor: '#FF6B35',
                      background: `linear-gradient(to right, #FF6B35 ${(sliderMilesTemp / 30) * 100}%, #FFE0D0 ${(sliderMilesTemp / 30) * 100}%)`,
                    }}
                  />
                </div>
                <Button onClick={handleRadiusConfirm} className="w-full" disabled={locationLoading}>
                  {locationLoading && <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />}
                  확인
                </Button>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground">위치 정보가 필요합니다</p>
                <Button
                  onClick={async () => {
                    const result = await getLocation()
                    if (result) {
                      setUserLat(result.lat)
                      setUserLng(result.lng)
                    }
                  }}
                  disabled={locationLoading}
                >
                  {locationLoading && <IconLoader2 className="h-4 w-4 animate-spin mr-2" />}
                  위치 허용하기
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

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

      {/* 위치 설정 확인 다이얼로그 */}
      <Dialog open={showLocationConfirm} onOpenChange={setShowLocationConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>위치 설정</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2 text-sm text-muted-foreground">
            <p>이 위치로 설정하시겠습니까?</p>
            {pendingLocation && (
              <p className="flex items-center gap-1 font-medium text-foreground">
                <IconMapPin className="w-4 h-4 text-primary shrink-0" />
                {pendingLocation.formatted}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLocationConfirm(false)
                setPendingLocation(null)
              }}
            >
              취소
            </Button>
            <Button onClick={handleLocationConfirm}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

            {/* 아바타 변경 */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarCompressing}
                className="relative w-24 h-24 rounded-full overflow-hidden bg-muted group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {avatarPreview || user.avatarUrl ? (
                  <img
                    src={avatarPreview || user.avatarUrl!}
                    alt={user.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-4xl font-medium text-muted-foreground">
                    {user.nickname.charAt(0)}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {avatarCompressing ? (
                    <IconLoader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <IconCamera className="w-6 h-6 text-white" />
                  )}
                </div>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">사진을 클릭하여 변경</p>
            </div>

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
                  readOnly
                  placeholder="위치 버튼을 눌러 설정해주세요"
                  className="cursor-default bg-muted/50"
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
