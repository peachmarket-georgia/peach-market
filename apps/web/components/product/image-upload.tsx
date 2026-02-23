'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { IconPhoto, IconX, IconCrown, IconGripVertical } from '@tabler/icons-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const MAX_IMAGES = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

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

  const addImages = useCallback(
    (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter((f) => ACCEPTED_TYPES.includes(f.type))
      const remaining = MAX_IMAGES - images.length
      const toAdd = validFiles.slice(0, remaining)

      const newItems: ImageItem[] = toAdd.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }))

      onChange([...images, ...newItems])
    },
    [images, onChange]
  )

  const removeImage = (id: string) => {
    const item = images.find((i) => i.id === id)
    if (item) URL.revokeObjectURL(item.preview)
    onChange(images.filter((i) => i.id !== id))
  }

  // 드래그 앤 드롭 순서 변경
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

  // 드롭존 (파일 추가용 — 순서 변경 드래그 중에는 무시)
  const isReordering = dragIndex !== null

  const handleZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isReordering) setDragOverZone(true)
  }

  const handleZoneDragLeave = () => {
    setDragOverZone(false)
  }

  const handleZoneDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverZone(false)
    if (isReordering) return
    if (e.dataTransfer.files.length > 0) {
      addImages(e.dataTransfer.files)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        상품 이미지{' '}
        <span className="text-muted-foreground font-normal">
          ({images.length}/{MAX_IMAGES})
        </span>
      </Label>

      {/* 이미지 프리뷰 */}
      {images.length > 0 && (
        <div className="flex gap-2 mb-2">
          {/* 대표이미지 (큰 사이즈) */}
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 0)}
            onDragOver={(e) => handleDragOver(e, 0)}
            onDrop={(e) => handleDrop(e, 0)}
            onDragEnd={handleDragEnd}
            className={cn(
              'relative aspect-square rounded-xl overflow-hidden bg-muted group/thumb cursor-grab active:cursor-grabbing transition-all shrink-0',
              images.length === 1 ? 'w-full' : 'w-2/5',
              dragIndex === 0 && 'opacity-40 scale-95',
              dragOverIndex === 0 && dragIndex !== 0 && 'ring-2 ring-primary'
            )}
          >
            <Image
              src={images[0]!.preview}
              alt="대표 이미지"
              fill
              className="object-cover pointer-events-none select-none"
              draggable={false}
            />
            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1">
              <IconCrown className="h-3 w-3" />
              대표
            </span>
            <button
              type="button"
              onClick={() => removeImage(images[0]!.id)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-black/80 z-10"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 나머지 이미지 (작은 그리드) */}
          {images.length > 1 && (
            <div className="grid grid-cols-2 gap-2 flex-1">
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
                      'relative aspect-square rounded-lg overflow-hidden bg-muted group/thumb cursor-grab active:cursor-grabbing transition-all',
                      dragIndex === idx && 'opacity-40 scale-95',
                      dragOverIndex === idx && dragIndex !== idx && 'ring-2 ring-primary'
                    )}
                  >
                    <Image
                      src={img.preview}
                      alt={`상품 이미지 ${idx + 1}`}
                      fill
                      className="object-cover pointer-events-none select-none"
                      draggable={false}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/40 to-transparent p-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex justify-center">
                      <IconGripVertical className="h-3.5 w-3.5 text-white" />
                    </div>
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
            </div>
          )}
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
            dragOverZone ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
          )}
        >
          <IconPhoto className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">클릭 또는 드래그하여 이미지 추가</p>
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
          드래그하여 순서를 변경할 수 있습니다. 첫 번째 이미지가 대표이미지로 사용됩니다.
        </p>
      )}
    </div>
  )
}
