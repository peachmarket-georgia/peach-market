'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { IconPhoto, IconX, IconCrown, IconLoader2 } from '@tabler/icons-react'
import imageCompression from 'browser-image-compression'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const MAX_IMAGES = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp',
  initialQuality: 0.85,
}

export type ImageItem = {
  id: string
  file: File
  preview: string
}

type ImageUploadProps = {
  images: ImageItem[]
  onChange: (images: ImageItem[]) => void
}

export const ImageUpload = ({ images, onChange }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOverZone, setDragOverZone] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [compressing, setCompressing] = useState(false)

  const addImages = useCallback(
    async (files: FileList | File[]) => {
      const allFiles = Array.from(files)

      const oversized = allFiles.filter((f) => f.size > MAX_FILE_SIZE)
      if (oversized.length > 0) {
        toast.error(`파일 크기는 10MB 이하여야 합니다.`, {
          description: oversized.map((f) => f.name).join(', '),
        })
      }

      const validFiles = allFiles.filter((f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE)
      const remaining = MAX_IMAGES - images.length

      if (images.length >= MAX_IMAGES || validFiles.length > remaining) {
        toast.error(`이미지는 최대 ${MAX_IMAGES}장까지 등록할 수 있습니다.`)
      }

      const toCompress = validFiles.slice(0, remaining)
      if (toCompress.length === 0) return

      setCompressing(true)
      try {
        const compressed = await Promise.all(
          toCompress.map(async (file) => {
            // GIF는 압축 스킵
            if (file.type === 'image/gif') return file
            return imageCompression(file, COMPRESSION_OPTIONS)
          })
        )

        const newItems: ImageItem[] = compressed.map((file) => ({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
        }))

        onChange([...images, ...newItems])
      } catch {
        toast.error('이미지 처리 중 오류가 발생했습니다.')
      } finally {
        setCompressing(false)
      }
    },
    [images, onChange]
  )

  const removeImage = (id: string) => {
    const item = images.find((i) => i.id === id)
    if (item) URL.revokeObjectURL(item.preview)
    onChange(images.filter((i) => i.id !== id))
  }

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
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
    const next = [...images]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(dropIdx, 0, moved!)
    onChange(next)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const isReordering = dragIndex !== null

  const handleZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isReordering) setDragOverZone(true)
  }

  const handleZoneDragLeave = () => setDragOverZone(false)

  const handleZoneDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverZone(false)
    if (isReordering) return
    if (e.dataTransfer.files.length > 0) addImages(e.dataTransfer.files)
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>
        상품 이미지{' '}
        <span className="text-muted-foreground font-normal">
          ({images.length}/{MAX_IMAGES})
        </span>
      </Label>

      {images.length === 0 ? (
        /* 빈 상태: 큰 드롭존 */
        <div
          onDragOver={handleZoneDragOver}
          onDragLeave={handleZoneDragLeave}
          onDrop={handleZoneDrop}
          onClick={() => !compressing && fileInputRef.current?.click()}
          className={cn(
            'aspect-4/3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
            compressing ? 'cursor-not-allowed border-primary/40 bg-primary/5' : 'cursor-pointer',
            !compressing &&
              (dragOverZone ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50')
          )}
        >
          {compressing ? (
            <>
              <IconLoader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-primary">이미지 압축 중...</p>
            </>
          ) : (
            <>
              <IconPhoto className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">클릭 또는 드래그하여 이미지 추가</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  JPG, PNG, WebP, GIF · 최대 {MAX_IMAGES}장 · 장당 10MB 이하
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        /*
         * 모자이크 그리드: [대표(2fr)] [thumb] [thumb]
         *                  [대표(2fr)] [thumb] [thumb]
         * → 5장 꽉 채움, 대표 이미지가 자연스럽게 정사각형 비율
         */
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
          {/* 대표 이미지 — 2행 span */}
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 0)}
            onDragOver={(e) => handleDragOver(e, 0)}
            onDrop={(e) => handleDrop(e, 0)}
            onDragEnd={handleDragEnd}
            className={cn(
              'row-span-2 relative rounded-xl overflow-hidden bg-muted group/thumb cursor-grab active:cursor-grabbing transition-all',
              dragIndex === 0 && 'opacity-40 scale-95',
              dragOverIndex === 0 && dragIndex !== 0 && 'ring-2 ring-primary'
            )}
          >
            <Image
              src={images[0]!.preview}
              alt="대표 이미지"
              fill
              unoptimized
              className="object-cover pointer-events-none select-none"
              draggable={false}
            />
            <span className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-primary text-white text-xs font-semibold flex items-center gap-1">
              <IconCrown className="h-3 w-3" />
              대표
            </span>
            <button
              type="button"
              onClick={() => removeImage(images[0]!.id)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-black/80 z-10"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>

          {/* 나머지 이미지 (최대 4장) — 오른쪽 2×2 자리 차지 */}
          {images.slice(1).map((img, i) => {
            const idx = i + 1
            return (
              <div
                key={img.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'aspect-square relative rounded-xl overflow-hidden bg-muted group/thumb cursor-grab active:cursor-grabbing transition-all',
                  dragIndex === idx && 'opacity-40 scale-95',
                  dragOverIndex === idx && dragIndex !== idx && 'ring-2 ring-primary'
                )}
              >
                <Image
                  src={img.preview}
                  alt={`상품 이미지 ${idx + 1}`}
                  fill
                  unoptimized
                  className="object-cover pointer-events-none select-none"
                  draggable={false}
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-black/80 z-10"
                >
                  <IconX className="h-3 w-3" />
                </button>
              </div>
            )
          })}

          {/* 추가 버튼 — 남은 슬롯에 자연스럽게 배치 */}
          {images.length < MAX_IMAGES && (
            <div
              onDragOver={handleZoneDragOver}
              onDragLeave={handleZoneDragLeave}
              onDrop={handleZoneDrop}
              onClick={() => !compressing && fileInputRef.current?.click()}
              className={cn(
                'aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors',
                compressing
                  ? 'cursor-not-allowed border-primary/40 bg-primary/5'
                  : 'cursor-pointer ' +
                      (dragOverZone ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50')
              )}
            >
              {compressing ? (
                <IconLoader2 className="h-5 w-5 text-primary animate-spin" />
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
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        disabled={compressing}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addImages(e.target.files)
          e.target.value = ''
        }}
      />

      {images.length > 1 && (
        <p className="text-xs text-muted-foreground">
          드래그하여 순서를 변경할 수 있습니다. 첫 번째 이미지가 대표이미지로 사용됩니다.
        </p>
      )}
    </div>
  )
}
