'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  IconChevronLeft,
  IconCurrencyDollar,
  IconLoader2,
  IconPhoto,
  IconX,
  IconCrown,
  IconGripVertical,
} from '@tabler/icons-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CATEGORIES } from '@/lib/product-types'
import { cn } from '@/lib/utils'
import { createProduct } from '@/lib/products-api'
import type { Category } from '@/lib/product-types'

const MAX_IMAGES = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

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

type ImageItem = {
  id: string
  file: File
  preview: string
}

type FieldErrors = {
  title?: string
  category?: string
  price?: string
  location?: string
}

const ProductCreatePage = () => {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [isLocationFocused, setIsLocationFocused] = useState(false)
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOverZone, setDragOverZone] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const numericPrice = Number(price.replaceAll(',', ''))
  const normalizedLocation = location.trim().toLowerCase()
  const filteredLocations = GEORGIA_LOCATIONS.filter((item) =>
    item.toLowerCase().includes(normalizedLocation)
  ).slice(0, 8)

  const isValid =
    title.trim() &&
    category &&
    price &&
    Number.isFinite(numericPrice) &&
    numericPrice >= 0 &&
    location.trim()

  const addImages = useCallback(
    (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter((f) =>
        ACCEPTED_TYPES.includes(f.type)
      )
      const remaining = MAX_IMAGES - images.length
      const toAdd = validFiles.slice(0, remaining)

      const newItems: ImageItem[] = toAdd.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }))

      setImages((prev) => [...prev, ...newItems])
    },
    [images.length]
  )

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter((i) => i.id !== id)
    })
  }

  // 드래그 앤 드롭 순서 변경
  const handleDragStart = (idx: number) => {
    setDragIndex(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOverIndex(idx)
  }

  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIdx) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }

    setImages((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(dropIdx, 0, moved!)
      return next
    })
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  // 드롭존 (파일 추가용)
  const handleZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverZone(true)
  }

  const handleZoneDragLeave = () => {
    setDragOverZone(false)
  }

  const handleZoneDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverZone(false)
    if (e.dataTransfer.files.length > 0) {
      addImages(e.dataTransfer.files)
    }
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

    if (!title.trim()) errors.title = '제목을 입력해 주세요'
    if (!category) errors.category = '카테고리를 선택해 주세요'
    if (!price || !Number.isFinite(numericPrice) || numericPrice < 0)
      errors.price = '가격을 입력해 주세요'
    if (!location.trim()) errors.location = '거래 희망 지역을 입력해 주세요'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || loading) return
    setLoading(true)
    setError('')
    try {
      await createProduct({
        title: title.trim(),
        category: category as Category,
        price: numericPrice,
        location: location.trim(),
        description: description.trim(),
      })
      router.push('/marketplace')
    } catch (e) {
      setError(e instanceof Error ? e.message : '등록에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-20 md:pb-8 md:mt-10">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/marketplace"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <IconChevronLeft className="h-4 w-4" />
          목록으로
        </Link>
        <h1 className="text-lg font-bold text-foreground">상품 등록</h1>
      </div>

      <div className="flex flex-col gap-5">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {/* 이미지 업로드 */}
        <div className="flex flex-col gap-1.5">
          <Label>
            상품 이미지{' '}
            <span className="text-muted-foreground font-normal">
              ({images.length}/{MAX_IMAGES})
            </span>
          </Label>

          {/* 이미지 프리뷰 그리드 */}
          {images.length > 0 && (
            <div className="grid grid-cols-5 gap-2 mb-2">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'relative aspect-square rounded-lg overflow-hidden bg-muted group/thumb cursor-grab active:cursor-grabbing transition-all',
                    dragIndex === idx && 'opacity-40 scale-95',
                    dragOverIndex === idx &&
                      dragIndex !== idx &&
                      'ring-2 ring-primary'
                  )}
                >
                  <Image
                    src={img.preview}
                    alt={`상품 이미지 ${idx + 1}`}
                    fill
                    sizes="100px"
                    className="object-cover"
                  />

                  {/* 대표이미지 마크 */}
                  {idx === 0 && (
                    <span className="absolute top-0 left-0 right-0 bg-primary/90 text-primary-foreground text-[10px] font-semibold text-center py-0.5 flex items-center justify-center gap-0.5">
                      <IconCrown className="h-2.5 w-2.5" />
                      대표
                    </span>
                  )}

                  {/* 드래그 핸들 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/40 to-transparent p-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex justify-center">
                    <IconGripVertical className="h-3.5 w-3.5 text-white" />
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-black/80"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 드롭존 */}
          {images.length < MAX_IMAGES && (
            <div
              onDragOver={handleZoneDragOver}
              onDragLeave={handleZoneDragLeave}
              onDrop={handleZoneDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 cursor-pointer transition-colors',
                dragOverZone
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50'
              )}
            >
              <IconPhoto className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  클릭 또는 드래그하여 이미지 추가
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  JPG, PNG, WebP, GIF · 최대 {MAX_IMAGES - images.length}장
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addImages(e.target.files)
                  e.target.value = ''
                }}
              />
            </div>
          )}

          {images.length > 1 && (
            <p className="text-xs text-muted-foreground">
              드래그하여 순서를 변경할 수 있습니다. 첫 번째 이미지가
              대표이미지로 사용됩니다.
            </p>
          )}
        </div>

        {/* 제목 */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">
            제목 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="상품명을 입력하세요"
            maxLength={50}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (e.target.value.trim())
                setFieldErrors((prev) => ({ ...prev, title: undefined }))
            }}
            className={cn(fieldErrors.title && 'border-destructive')}
          />
          <div className="flex justify-between">
            {fieldErrors.title ? (
              <span className="text-xs text-destructive">
                {fieldErrors.title}
              </span>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted-foreground">
              {title.length}/50
            </span>
          </div>
        </div>

        {/* 카테고리 */}
        <div className="flex flex-col gap-1.5">
          <Label>
            카테고리 <span className="text-destructive">*</span>
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
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  category === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          {fieldErrors.category && (
            <span className="text-xs text-destructive">
              {fieldErrors.category}
            </span>
          )}
        </div>

        {/* 가격 */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">
            가격 (USD) <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <IconCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="price"
              type="text"
              placeholder="0"
              value={price}
              inputMode="numeric"
              onChange={(e) => handlePriceChange(e.target.value)}
              className={cn('pl-9', fieldErrors.price && 'border-destructive')}
            />
          </div>
          {fieldErrors.price && (
            <span className="text-xs text-destructive">
              {fieldErrors.price}
            </span>
          )}
        </div>

        {/* 거래 희망 지역 */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">
            거래 희망 지역 <span className="text-destructive">*</span>
          </Label>
          <div>
            <Input
              id="location"
              placeholder="예: Duluth"
              value={location}
              onFocus={() => setIsLocationFocused(true)}
              onBlur={() => setTimeout(() => setIsLocationFocused(false), 100)}
              onChange={(e) => {
                setLocation(e.target.value)
                if (e.target.value.trim())
                  setFieldErrors((prev) => ({ ...prev, location: undefined }))
              }}
              autoComplete="off"
              className={cn(fieldErrors.location && 'border-destructive')}
            />
            {isLocationFocused && filteredLocations.length > 0 && (
              <div className="mt-1 w-full rounded-md border bg-popover shadow-md">
                <ul className="max-h-48 overflow-y-auto p-1">
                  {filteredLocations.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
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
          {fieldErrors.location && (
            <span className="text-xs text-destructive">
              {fieldErrors.location}
            </span>
          )}
        </div>

        {/* 상품 설명 */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">상품 설명</Label>
          <Textarea
            className="h-40 resize-none"
            id="description"
            placeholder={DESCRIPTION_PLACEHOLDER}
            rows={6}
            value={description}
            onFocus={() => {
              if (!description.trim()) {
                setDescription(DESCRIPTION_TEMPLATE)
              }
            }}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* 등록 버튼 */}
        <Button
          className={cn(
            'w-full h-12 text-base',
            !isValid && 'bg-muted text-muted-foreground hover:bg-muted'
          )}
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
          등록하기
        </Button>
      </div>
    </div>
  )
}

export default ProductCreatePage
