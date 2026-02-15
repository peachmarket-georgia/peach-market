'use client'

import { useState } from 'react'
import { DollarSign } from 'lucide-react'
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
import { CATEGORIES } from '@/lib/data'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/data'

interface ProductCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductCreateModal({
  open,
  onOpenChange,
}: ProductCreateModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  const isValid =
    title.trim() && category && price && location.trim() && description.trim()

  const handleSubmit = () => {
    if (!isValid) return

    const product = {
      title: title.trim(),
      category,
      price: Number(price),
      location: location.trim(),
      description: description.trim(),
    }

    console.log('새 상품 등록:', product)

    // 폼 초기화 & 모달 닫기
    setTitle('')
    setCategory('')
    setPrice('')
    setLocation('')
    setDescription('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>상품 등록</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
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
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="price"
                type="number"
                min={0}
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* 거래 희망 지역 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">거래 희망 지역</Label>
            <Input
              id="location"
              placeholder="예: Duluth, GA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* 상품 설명 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">상품 설명</Label>
            <Textarea
              id="description"
              placeholder="상품 상태, 사용 기간, 거래 방법 등을 자세히 적어주세요"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full" disabled={!isValid} onClick={handleSubmit}>
            등록하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
