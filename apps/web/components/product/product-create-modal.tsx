'use client'

import { useState } from 'react'
import { IconCurrencyDollar, IconLoader2 } from '@tabler/icons-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CATEGORIES } from '@/lib/types'
import { cn } from '@/lib/utils'
import { createProduct } from '@/lib/api'
import type { Category } from '@/lib/types'

type ProductCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

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

export function ProductCreateModal({
  open,
  onOpenChange,
  onCreated,
}: ProductCreateModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [isLocationFocused, setIsLocationFocused] = useState(false)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
    location.trim() &&
    description.trim()

  const handlePriceChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '')
    setPrice(digitsOnly ? Number(digitsOnly).toLocaleString('en-US') : '')
  }

  const handleLocationSelect = (value: string) => {
    setLocation(value)
    setIsLocationFocused(false)
  }

  const handleSubmit = async () => {
    if (!isValid || loading) return
    setLoading(true)
    setError('')
    try {
      await createProduct({
        title: title.trim(),
        category,
        price: numericPrice,
        location: location.trim(),
        description: description.trim(),
      })

      setTitle('')
      setCategory('')
      setPrice('')
      setLocation('')
      setIsLocationFocused(false)
      setDescription('')
      onOpenChange(false)
      onCreated?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : '등록에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>상품 등록</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          {/* 제목 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              placeholder="상품명을 입력하세요"
              maxLength={50}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <span className="text-xs text-muted-foreground text-right">
              {title.length}/50
            </span>
          </div>

          {/* 카테고리 */}
          <div className="flex flex-col gap-1.5">
            <Label>카테고리</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
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
          </div>

          {/* 가격 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">가격 (USD)</Label>
            <div className="relative">
              <IconCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="price"
                type="text"
                placeholder="0"
                value={price}
                inputMode="numeric"
                onChange={(e) => handlePriceChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* 거래 희망 지역 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">거래 희망 지역</Label>
            <div>
              <Input
                id="location"
                placeholder="예: Duluth"
                value={location}
                onFocus={() => setIsLocationFocused(true)}
                onBlur={() =>
                  setTimeout(() => setIsLocationFocused(false), 100)
                }
                onChange={(e) => setLocation(e.target.value)}
                autoComplete="off"
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
          </div>

          {/* 상품 설명 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">상품 설명</Label>
            <Textarea
              className="h-32 resize-none"
              id="description"
              placeholder={DESCRIPTION_PLACEHOLDER}
              rows={5}
              value={description}
              onFocus={() => {
                if (!description.trim()) {
                  setDescription(DESCRIPTION_TEMPLATE)
                }
              }}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            disabled={!isValid || loading}
            onClick={handleSubmit}
          >
            {loading && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
            등록하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
