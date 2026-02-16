'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Camera, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

const NewProductPage = () => {
  const [images, setImages] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [acceptOffer, setAcceptOffer] = useState(false)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')

  const handleImageAdd = () => {
    if (images.length >= 10) return
    // 실제 업로드 없이 placeholder 이미지 추가
    const placeholders = [
      'https://picsum.photos/seed/p1/400/400',
      'https://picsum.photos/seed/p2/400/400',
      'https://picsum.photos/seed/p3/400/400',
      'https://picsum.photos/seed/p4/400/400',
      'https://picsum.photos/seed/p5/400/400',
    ]
    const next = placeholders[images.length % placeholders.length]!
    setImages((prev) => [...prev, next])
  }

  const handleImageRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const isValid = title.trim() && category && price

  return (
    <div className="mx-auto max-w-2xl">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/marketplace"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← 돌아가기
          </Link>
          <h1 className="text-lg font-semibold text-foreground">매물 등록</h1>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* 이미지 업로드 */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            상품 이미지{' '}
            <span className="text-muted-foreground font-normal">
              ({images.length}/10)
            </span>
          </label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {/* 추가 버튼 */}
            <button
              type="button"
              onClick={handleImageAdd}
              disabled={images.length >= 10}
              className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-input bg-muted/50 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50 disabled:hover:border-input disabled:hover:text-muted-foreground"
            >
              <Camera className="size-6" />
              <span className="text-xs">사진 추가</span>
            </button>

            {/* 업로드된 이미지들 */}
            {images.map((src, idx) => (
              <div
                key={idx}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted"
              >
                <img
                  src={src}
                  alt={`상품 이미지 ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
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
        </section>

        {/* 제목 */}
        <section className="space-y-2">
          <label
            htmlFor="title"
            className="text-sm font-medium text-foreground"
          >
            제목
          </label>
          <Input
            id="title"
            placeholder="상품명을 입력해주세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </section>

        {/* 카테고리 */}
        <section className="space-y-2">
          <label
            htmlFor="category"
            className="text-sm font-medium text-foreground"
          >
            카테고리
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
          <label
            htmlFor="price"
            className="text-sm font-medium text-foreground"
          >
            가격
          </label>
          <div className="relative">
            <Input
              id="price"
              type="number"
              placeholder="가격을 입력해주세요"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="pr-8"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              원
            </span>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={acceptOffer}
              onChange={(e) => setAcceptOffer(e.target.checked)}
              className="size-4 rounded border-input accent-primary"
            />
            가격 제안 받기
          </label>
        </section>

        {/* 설명 */}
        <section className="space-y-2">
          <label
            htmlFor="description"
            className="text-sm font-medium text-foreground"
          >
            자세한 설명
          </label>
          <textarea
            id="description"
            rows={6}
            placeholder="상품 상태, 구매 시기, 사용감 등을 자세히 적어주세요."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full resize-none rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] md:text-sm"
          />
        </section>

        {/* 거래 희망 장소 */}
        <section className="space-y-2">
          <label
            htmlFor="location"
            className="text-sm font-medium text-foreground"
          >
            거래 희망 장소
          </label>
          <Input
            id="location"
            placeholder="장소를 입력해주세요 (예: 강남역 2번 출구)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </section>

        {/* 등록 버튼 */}
        <div className="sticky bottom-4 flex gap-3 pb-4 md:static md:pb-0">
          <Link href="/marketplace" className="flex-1">
            <Button variant="outline" className="w-full">
              취소
            </Button>
          </Link>
          <Button className="flex-1" disabled={!isValid}>
            등록하기
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NewProductPage
