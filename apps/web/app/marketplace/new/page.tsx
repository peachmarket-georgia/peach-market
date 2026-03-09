'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconChevronLeft, IconCurrencyDollar, IconLoader2, IconCurrentLocation } from '@tabler/icons-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CATEGORIES } from '@/lib/product-types'
import { cn } from '@/lib/utils'
import { createProduct } from '@/lib/products-api'
import { ImageUpload } from '@/components/product/image-upload'
import { StepIndicator } from '@/components/ui/step-indicator'
import { useGeolocation } from '@/hooks/use-geolocation'
import type { ImageItem } from '@/components/product/image-upload'
import type { Category } from '@/lib/product-types'

const GEORGIA_LOCATIONS = [
  'Atlanta',
  'Augusta',
  'Columbus',
  'Macon',
  'Savannah',
  'Athens',
  'Sandy Springs',
  'Roswell',
  'Johns Creek',
  'Warner Robins',
  'Alpharetta',
  'Marietta',
  'Smyrna',
  'Duluth',
  'Lawrenceville',
  'Suwanee',
  'Gainesville',
  'Dunwoody',
  'Decatur',
  'Peachtree City',
] as const

const DESCRIPTION_TEMPLATE = `상품 상태:
사용 기간:
거래 방법:
거래 가능 시간:
하자/특이사항:`

const DESCRIPTION_PLACEHOLDER = `예시)
상품 상태: A급, 생활기스 거의 없음
사용 기간: 6개월
거래 방법: 직거래
거래 가능 시간: 평일 19시 이후 / 주말 협의
하자/특이사항: 정품 박스 포함, 환불 불가`

type FieldErrors = {
  images?: string
  title?: string
  category?: string
  price?: string
  location?: string
}

const ProductCreatePage = (): React.JSX.Element => {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [isLocationFocused, setIsLocationFocused] = useState(false)
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<ImageItem[]>([])
  const [lat, setLat] = useState<number | undefined>(undefined)
  const [lng, setLng] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const { loading: locationLoading, getLocation } = useGeolocation()

  const handleGetLocation = async () => {
    const result = await getLocation()
    if (result) {
      setLocation(result.formatted)
      setLat(result.lat)
      setLng(result.lng)
      setFieldErrors((prev) => ({ ...prev, location: undefined }))
    }
  }

  const numericPrice = Number(price.replaceAll(',', ''))
  const normalizedLocation = location.trim().toLowerCase()
  const filteredLocations = GEORGIA_LOCATIONS.filter((item) => item.toLowerCase().includes(normalizedLocation)).slice(
    0,
    8
  )

  // Step Indicator 계산
  const hasImages = images.length > 0
  const hasBasicInfo = title.trim() && category && price && location.trim()
  const hasDescription = description.trim().length > 0

  const getCurrentStep = () => {
    if (!hasImages) return 0
    if (!hasBasicInfo) return 1
    return 2
  }

  const steps = [
    { label: '사진 등록', completed: hasImages },
    { label: '기본 정보', completed: Boolean(hasBasicInfo) },
    { label: '상품 설명', completed: hasDescription },
  ]

  const isValid =
    title.trim() && category && price && Number.isFinite(numericPrice) && numericPrice >= 0 && location.trim()

  const handlePriceChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '')
    setPrice(digitsOnly ? Number(digitsOnly).toLocaleString('en-US') : '')
    if (digitsOnly) setFieldErrors((prev) => ({ ...prev, price: undefined }))
  }

  const handleLocationSelect = (value: string) => {
    setLocation(value)
    setIsLocationFocused(false)
    setFieldErrors((prev) => ({ ...prev, location: undefined }))
  }

  const validate = (): boolean => {
    const errors: FieldErrors = {}

    if (images.length === 0) errors.images = '이미지를 최소 1장 이상 등록해 주세요'
    if (!title.trim()) errors.title = '제목을 입력해 주세요'
    if (!category) errors.category = '카테고리를 선택해 주세요'
    if (!price || !Number.isFinite(numericPrice) || numericPrice < 0) errors.price = '가격을 입력해 주세요'
    if (!location.trim()) errors.location = '거래 희망 지역을 입력해 주세요'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || loading) return
    setLoading(true)
    setError('')
    try {
      await createProduct(
        {
          title: title.trim(),
          category: category as Category,
          price: numericPrice,
          location: location.trim(),
          description: description.trim(),
          lat,
          lng,
        },
        images.map((img) => img.file)
      )
      router.push('/marketplace')
    } catch (e) {
      setError(e instanceof Error ? e.message : '등록에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pb-24 md:pb-10 md:mt-10">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1 text-sm text-fg-secondary hover:text-primary transition-colors mb-3"
        >
          <IconChevronLeft className="h-4 w-4" />
          목록으로
        </Link>
        <h1 className="text-2xl font-extrabold text-foreground">상품 등록</h1>
        <p className="text-sm text-fg-tertiary mt-0.5">조지아 한인 중고마켓에 올려보세요 🍑</p>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={getCurrentStep()} className="mb-6" />

      <div className="flex flex-col gap-6">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* 이미지 업로드 */}
        <div className="flex flex-col gap-1.5">
          <ImageUpload
            images={images}
            onChange={(imgs) => {
              setImages(imgs)
              if (imgs.length > 0) setFieldErrors((prev) => ({ ...prev, images: undefined }))
            }}
          />
          {fieldErrors.images && <span className="text-xs text-destructive">{fieldErrors.images}</span>}
        </div>

        {/* 기본 정보 카드 */}
        <div className="bg-white rounded-2xl border-2 border-peach-muted p-4 shadow-sm flex flex-col gap-5">
          {/* 제목 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title" className="text-sm font-semibold text-foreground">
              제목 <span className="text-primary">*</span>
            </Label>
            <Input
              id="title"
              placeholder="상품명을 입력하세요"
              maxLength={50}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (e.target.value.trim()) setFieldErrors((prev) => ({ ...prev, title: undefined }))
              }}
              className={cn(
                'h-11 rounded-xl border-2 border-peach-muted focus-visible:ring-0 focus-visible:border-primary transition-colors',
                fieldErrors.title && 'border-destructive focus-visible:border-destructive'
              )}
            />
            <div className="flex justify-between">
              {fieldErrors.title ? <span className="text-xs text-destructive">{fieldErrors.title}</span> : <span />}
              <span className="text-xs text-fg-tertiary">{title.length}/50</span>
            </div>
          </div>

          {/* 카테고리 */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-foreground">
              카테고리 <span className="text-primary">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat)
                    setFieldErrors((prev) => ({ ...prev, category: undefined }))
                  }}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
                    category === cat
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'bg-white border-2 border-peach-muted text-fg-secondary hover:border-primary/40 hover:text-primary'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            {fieldErrors.category && <span className="text-xs text-destructive">{fieldErrors.category}</span>}
          </div>

          {/* 가격 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price" className="text-sm font-semibold text-foreground">
              가격 (USD) <span className="text-primary">*</span>
            </Label>
            <div className="relative">
              <IconCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
              <Input
                id="price"
                type="text"
                placeholder="0"
                value={price}
                inputMode="numeric"
                onChange={(e) => handlePriceChange(e.target.value)}
                className={cn(
                  'pl-9 h-11 rounded-xl border-2 border-peach-muted focus-visible:ring-0 focus-visible:border-primary transition-colors',
                  fieldErrors.price && 'border-destructive focus-visible:border-destructive'
                )}
              />
            </div>
            {fieldErrors.price && <span className="text-xs text-destructive">{fieldErrors.price}</span>}
          </div>

          {/* 거래 희망 지역 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location" className="text-sm font-semibold text-foreground">
              거래 희망 지역 <span className="text-primary">*</span>
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="location"
                  placeholder="예: Duluth"
                  value={location}
                  onFocus={() => setIsLocationFocused(true)}
                  onBlur={() => setTimeout(() => setIsLocationFocused(false), 100)}
                  onChange={(e) => {
                    setLocation(e.target.value)
                    setLat(undefined)
                    setLng(undefined)
                    if (e.target.value.trim()) setFieldErrors((prev) => ({ ...prev, location: undefined }))
                  }}
                  autoComplete="off"
                  className={cn(
                    'h-11 rounded-xl border-2 border-peach-muted focus-visible:ring-0 focus-visible:border-primary transition-colors',
                    fieldErrors.location && 'border-destructive focus-visible:border-destructive'
                  )}
                />
                {isLocationFocused && filteredLocations.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border-2 border-peach-muted rounded-xl shadow-xl py-1.5 overflow-hidden">
                    <ul className="max-h-48 overflow-y-auto p-1">
                      {filteredLocations.map((item) => (
                        <li key={item}>
                          <button
                            type="button"
                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-fg-secondary hover:bg-peach-subtle hover:text-primary transition-colors"
                            onMouseDown={() => handleLocationSelect(item)}
                          >
                            {item}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGetLocation}
                disabled={locationLoading}
                title="현재 위치 가져오기"
                className="shrink-0 h-11 w-11 rounded-xl border-2 border-peach-muted"
              >
                {locationLoading ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconCurrentLocation className={cn('h-4 w-4', lat != null ? 'text-primary' : '')} />
                )}
              </Button>
            </div>
            {fieldErrors.location && <span className="text-xs text-destructive">{fieldErrors.location}</span>}
            {lat != null && <p className="text-xs text-primary">📍 GPS 좌표가 저장되었습니다</p>}
          </div>
        </div>

        {/* 상품 설명 카드 */}
        <div className="bg-white rounded-2xl border-2 border-peach-muted p-4 shadow-sm">
          <Label htmlFor="description" className="text-sm font-semibold text-foreground mb-1.5 block">
            상품 설명
          </Label>
          <Textarea
            className="h-40 resize-none rounded-xl border-2 border-peach-muted focus-visible:ring-0 focus-visible:border-primary transition-colors"
            id="description"
            placeholder={DESCRIPTION_PLACEHOLDER}
            rows={6}
            value={description}
            onFocus={() => {
              if (!description.trim()) setDescription(DESCRIPTION_TEMPLATE)
            }}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* 등록 버튼 */}
        <Button
          className={cn(
            'w-full h-12 rounded-full text-base font-bold shadow-md transition-all active:scale-95',
            isValid
              ? 'bg-primary hover:bg-primary/90 text-white hover:shadow-lg'
              : 'bg-peach-muted text-fg-tertiary cursor-not-allowed'
          )}
          disabled={loading || !isValid}
          onClick={handleSubmit}
        >
          {loading ? (
            <>
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              등록 중...
            </>
          ) : (
            '등록하기'
          )}
        </Button>
      </div>
    </div>
  )
}

export default ProductCreatePage
