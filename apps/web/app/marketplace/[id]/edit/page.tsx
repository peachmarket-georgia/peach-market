'use client'

import { useState, useEffect, useRef, ChangeEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { IconChevronLeft, IconCurrencyDollar, IconLoader2, IconPhoto, IconX, IconCrown } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { checkAuth, uploadApi } from '@/lib/api'
import { productApi } from '@/lib/products-api'
import { CATEGORIES } from '@/lib/product-types'
import type { PaymentMethod, ProductResponseDto, UserProfileResponseDto } from '@/types/api'
import type { Category } from '@/lib/product-types'
import { toast } from 'sonner'

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

const DESCRIPTION_PLACEHOLDER = `예시)
상품 상태: A급, 생활기스 거의 없음
사용 기간: 6개월
거래 방법: 직거래
거래 가능 시간: 평일 19시 이후 / 주말 협의
하자/특이사항: 정품 박스 포함, 환불 불가`

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: '현금' },
  { value: 'ZELLE', label: 'Zelle' },
  { value: 'VENMO', label: 'Venmo' },
]

type FieldErrors = {
  images?: string
  title?: string
  category?: string
  price?: string
  location?: string
}

const MAX_IMAGES = 5

const EditProductPage = () => {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [product, setProduct] = useState<ProductResponseDto | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfileResponseDto | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [isLocationFocused, setIsLocationFocused] = useState(false)
  const [description, setDescription] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const normalizedLocation = location.trim().toLowerCase()
  const filteredLocations = GEORGIA_LOCATIONS.filter((item) => item.toLowerCase().includes(normalizedLocation)).slice(
    0,
    8
  )

  useEffect(() => {
    const loadData = async () => {
      const [productRes, authRes] = await Promise.all([productApi.getProduct(productId), checkAuth()])

      if (!authRes.isAuthenticated) {
        router.push('/login')
        return
      }
      if (!productRes.data) {
        router.push('/marketplace')
        return
      }
      if (authRes.user && productRes.data.seller.id !== authRes.user.id) {
        router.push(`/marketplace/${productId}`)
        return
      }

      setCurrentUser(authRes.user ?? null)
      setProduct(productRes.data)

      const p = productRes.data
      setImages(p.images || [])
      setTitle(p.title)
      setCategory(p.category as Category)
      setPrice(Math.round(p.price / 100).toLocaleString('en-US'))
      setDescription(p.description)
      setLocation(p.location)
      setPaymentMethods(p.paymentMethods || [])
      setInitialLoading(false)
    }
    loadData()
  }, [productId, router])

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remaining = MAX_IMAGES - images.length
    const filesToUpload = Array.from(files).slice(0, remaining)

    if (Array.from(files).length > remaining) {
      toast.error(`이미지는 최대 ${MAX_IMAGES}장까지 등록할 수 있습니다.`)
    }

    setUploading(true)
    const { data, error } = await uploadApi.uploadImages(filesToUpload)
    setUploading(false)

    if (error) {
      toast.error(error)
      return
    }
    if (data?.images) {
      const newUrls = data.images.map((img) => img.url)
      setImages((prev) => {
        const updated = [...prev, ...newUrls]
        if (updated.length > 0) setFieldErrors((fe) => ({ ...fe, images: undefined }))
        return updated
      })
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImageRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePaymentMethodToggle = (method: PaymentMethod) => {
    setPaymentMethods((prev) => (prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]))
  }

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
    if (!price) errors.price = '가격을 입력해 주세요'
    if (!location.trim()) errors.location = '거래 희망 지역을 입력해 주세요'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const numericPrice = Number(price.replaceAll(',', ''))
  const isValid = title.trim() && category && price && location.trim() && images.length > 0

  const handleSubmit = async () => {
    if (!validate() || loading) return
    setLoading(true)
    try {
      const { data, error } = await productApi.updateProduct(productId, {
        title: title.trim(),
        description: description.trim(),
        price: numericPrice * 100,
        category,
        images,
        location: location.trim(),
        paymentMethods: paymentMethods.length > 0 ? paymentMethods : undefined,
      })
      if (error) {
        toast.error(error)
        return
      }
      if (data) router.push(`/marketplace/${productId}`)
    } catch {
      toast.error('수정에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex justify-center py-20">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!product || !currentUser) return null

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pb-24 md:pb-10 md:mt-10">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/marketplace/${productId}`}
          className="inline-flex items-center gap-1 text-sm text-fg-secondary hover:text-primary transition-colors mb-3"
        >
          <IconChevronLeft className="h-4 w-4" />
          돌아가기
        </Link>
        <h1 className="text-2xl font-extrabold text-foreground">상품 수정</h1>
        <p className="text-sm text-fg-tertiary mt-0.5">수정할 내용을 입력해주세요 🍑</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* 이미지 섹션 */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-semibold text-foreground">
            상품 이미지{' '}
            <span className="text-muted-foreground font-normal">
              ({images.length}/{MAX_IMAGES})
            </span>
          </Label>

          {images.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-4/3 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-muted-foreground/50 transition-colors"
            >
              <IconPhoto className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">클릭하여 이미지 추가</p>
                <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, WebP · 최대 {MAX_IMAGES}장</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
              {/* 대표 이미지 */}
              <div className="row-span-2 relative rounded-xl overflow-hidden bg-muted group/thumb">
                <img src={images[0]} alt="대표 이미지" className="absolute inset-0 w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-primary text-white text-xs font-semibold flex items-center gap-1">
                  <IconCrown className="h-3 w-3" />
                  대표
                </span>
                <button
                  type="button"
                  onClick={() => handleImageRemove(0)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-black/80 z-10"
                >
                  <IconX className="h-4 w-4" />
                </button>
              </div>

              {/* 나머지 이미지 */}
              {images.slice(1).map((src, i) => (
                <div key={i} className="aspect-square relative rounded-xl overflow-hidden bg-muted group/thumb">
                  <img src={src} alt={`상품 이미지 ${i + 2}`} className="absolute inset-0 w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(i + 1)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-black/80 z-10"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* 추가 버튼 */}
              {images.length < MAX_IMAGES && (
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-muted-foreground/50 transition-colors"
                >
                  {uploading ? (
                    <IconLoader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <IconPhoto className="h-5 w-5 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">추가</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
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
            <div className="relative">
              <Input
                id="location"
                placeholder="예: Duluth"
                value={location}
                onFocus={() => setIsLocationFocused(true)}
                onBlur={() => setTimeout(() => setIsLocationFocused(false), 100)}
                onChange={(e) => {
                  setLocation(e.target.value)
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
            {fieldErrors.location && <span className="text-xs text-destructive">{fieldErrors.location}</span>}
          </div>

          {/* 선호 결제 수단 */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-foreground">
              선호 결제 수단 <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => handlePaymentMethodToggle(method.value)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
                    paymentMethods.includes(method.value)
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'bg-white border-2 border-peach-muted text-fg-secondary hover:border-primary/40 hover:text-primary'
                  )}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 상품 설명 카드 */}
        <div className="bg-white rounded-2xl border-2 border-peach-muted p-4 shadow-sm">
          <Label htmlFor="description" className="text-sm font-semibold text-foreground mb-1.5 block">
            상품 설명
          </Label>
          <Textarea
            id="description"
            className="h-40 resize-none rounded-xl border-2 border-peach-muted focus-visible:ring-0 focus-visible:border-primary transition-colors"
            placeholder={DESCRIPTION_PLACEHOLDER}
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="text-xs text-fg-tertiary text-right mt-1">{description.length}/2000</p>
        </div>

        {/* 수정 버튼 */}
        <Button
          className={cn(
            'w-full h-12 rounded-full text-base font-bold shadow-md transition-all active:scale-95',
            isValid
              ? 'bg-primary hover:bg-primary/90 text-white hover:shadow-lg'
              : 'bg-peach-muted text-fg-tertiary cursor-not-allowed'
          )}
          disabled={loading || uploading || !isValid}
          onClick={handleSubmit}
        >
          {loading ? (
            <>
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              수정 중...
            </>
          ) : (
            '수정하기'
          )}
        </Button>
      </div>
    </div>
  )
}

export default EditProductPage
