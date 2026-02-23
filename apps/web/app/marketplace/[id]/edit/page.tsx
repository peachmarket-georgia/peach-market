'use client'

import { useState, useEffect, useRef, ChangeEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Camera, X, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/layout/header'
import { checkAuth, productApi, uploadApi } from '@/lib/api'
import { PaymentMethod, ProductResponseDto, UserProfileResponseDto } from '@/types/api'

const CATEGORIES = [
  '디지털기기',
  '생활가전',
  '가구/인테리어',
  '생활/주방',
  '유아동',
  '의류',
  '스포츠/레저',
  '도서',
  '게임/취미',
  '뷰티/미용',
  '반려동물용품',
  '기타',
]

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: '현금' },
  { value: 'ZELLE', label: 'Zelle' },
  { value: 'VENMO', label: 'Venmo' },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const EditProductPage = () => {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [product, setProduct] = useState<ProductResponseDto | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfileResponseDto | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  // 데이터 로드
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

      // 소유자 확인
      if (authRes.user && productRes.data.seller.id !== authRes.user.id) {
        router.push(`/marketplace/${productId}`)
        return
      }

      setCurrentUser(authRes.user ?? null)
      setProduct(productRes.data)

      // 폼 초기화
      const p = productRes.data
      setImages(p.images || [])
      setTitle(p.title)
      setCategory(p.category)
      setPrice((p.price / 100).toFixed(2))
      setDescription(p.description)
      setLocation(p.location)
      setPaymentMethods(p.paymentMethods || [])

      setInitialLoading(false)
    }

    loadData()
  }, [productId, router])

  const handleImageClick = () => {
    if (images.length >= 5 || uploading) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // 최대 5개 제한
    const remainingSlots = 5 - images.length
    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    // 파일 검증
    for (const file of filesToUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('JPG, PNG, WebP 형식만 업로드 가능합니다.')
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('파일 크기는 5MB 이하여야 합니다.')
        return
      }
    }

    setUploading(true)
    setError(null)

    const { data, error: uploadError } = await uploadApi.uploadImages(filesToUpload)

    setUploading(false)

    if (uploadError) {
      setError(uploadError)
      return
    }

    if (data?.images) {
      const newUrls = data.images.map((img) => img.url)
      setImages((prev) => [...prev, ...newUrls])
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImageRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePaymentMethodToggle = (method: PaymentMethod) => {
    setPaymentMethods((prev) => (prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]))
  }

  const isValid = title.trim() && category && price && description.trim() && location.trim() && images.length > 0

  const handleSubmit = async () => {
    if (!isValid || loading) return

    setLoading(true)
    setError(null)

    // 가격을 센트 단위로 변환 (USD)
    const priceInCents = Math.round(parseFloat(price) * 100)

    const { data, error: apiError } = await productApi.updateProduct(productId, {
      title: title.trim(),
      description: description.trim(),
      price: priceInCents,
      category,
      images,
      location: location.trim(),
      paymentMethods: paymentMethods.length > 0 ? paymentMethods : undefined,
    })

    setLoading(false)

    if (apiError) {
      setError(apiError)
      return
    }

    if (data) {
      router.push(`/marketplace/${productId}`)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!product || !currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/marketplace/${productId}`} className="text-sm text-muted-foreground hover:text-foreground">
              ← 돌아가기
            </Link>
            <h1 className="text-lg font-semibold text-foreground">매물 수정</h1>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-8">
          {/* 이미지 업로드 */}
          <section className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              상품 이미지 <span className="text-muted-foreground font-normal">({images.length}/5) *</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex gap-3 overflow-x-auto pb-2">
              {/* 추가 버튼 */}
              <button
                type="button"
                onClick={handleImageClick}
                disabled={images.length >= 5 || uploading}
                className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-input bg-muted/50 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50 disabled:hover:border-input disabled:hover:text-muted-foreground"
              >
                {uploading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <>
                    <Camera className="size-6" />
                    <span className="text-xs">사진 추가</span>
                  </>
                )}
              </button>

              {/* 업로드된 이미지들 */}
              {images.map((src, idx) => (
                <div key={idx} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img src={src} alt={`상품 이미지 ${idx + 1}`} className="h-full w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-primary/90 py-0.5 text-center text-[10px] font-medium text-primary-foreground">
                      대표
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleImageRemove(idx)}
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP / 최대 5MB</p>
          </section>

          {/* 제목 */}
          <section className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              제목 *
            </label>
            <Input
              id="title"
              placeholder="상품명을 입력해주세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
            />
          </section>

          {/* 카테고리 */}
          <section className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium text-foreground">
              카테고리 *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] md:text-sm"
            >
              <option value="" disabled>
                카테고리를 선택해주세요
              </option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </section>

          {/* 가격 */}
          <section className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium text-foreground">
              가격 (USD) *
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-7"
                min="0"
                step="0.01"
              />
            </div>
          </section>

          {/* 선호 결제 수단 */}
          <section className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              선호 결제 수단 <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => handlePaymentMethodToggle(method.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    paymentMethods.includes(method.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </section>

          {/* 설명 */}
          <section className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              자세한 설명 *
            </label>
            <textarea
              id="description"
              rows={6}
              placeholder="상품 상태, 구매 시기, 사용감 등을 자세히 적어주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full resize-none rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] md:text-sm"
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
          </section>

          {/* 거래 희망 장소 */}
          <section className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium text-foreground">
              거래 희망 장소 *
            </label>
            <Input
              id="location"
              placeholder="예: Duluth, GA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </section>

          {/* 수정 버튼 */}
          <div className="sticky bottom-4 flex gap-3 pb-4 md:static md:pb-0">
            <Link href={`/marketplace/${productId}`} className="flex-1">
              <Button variant="outline" className="w-full" disabled={loading}>
                취소
              </Button>
            </Link>
            <Button className="flex-1" disabled={!isValid || loading || uploading} onClick={handleSubmit}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  수정 중...
                </>
              ) : (
                '수정하기'
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default EditProductPage
