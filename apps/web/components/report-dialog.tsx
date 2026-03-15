'use client'

import { useState, useRef } from 'react'
import { IconFlag, IconPhoto, IconX, IconLoader2 } from '@tabler/icons-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { reportApi, uploadApi } from '@/lib/api'
import type { ReportType } from '@/types/api'

const USER_REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'SCAM', label: '사기' },
  { value: 'NO_SHOW', label: '노쇼' },
  { value: 'COMMERCIAL_SELLER', label: '업자' },
  { value: 'PROFANITY', label: '욕설' },
  { value: 'EXPLICIT_CONTENT', label: '음란물' },
  { value: 'INAPPROPRIATE', label: '부적절한 행동' },
  { value: 'SPAM', label: '스팸' },
  { value: 'OTHER', label: '기타' },
]

const BUG_REPORT_TYPES: { value: ReportType; label: string }[] = [{ value: 'BUG', label: '버그 신고' }]

type ReportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUserId?: string
  targetUserNickname?: string
  productId?: string
  reportType?: 'user' | 'bug'
  onBlockUser?: () => Promise<void>
}

export function ReportDialog({
  open,
  onOpenChange,
  targetUserId,
  targetUserNickname,
  productId,
  reportType = 'user',
  onBlockUser,
}: ReportDialogProps) {
  const [type, setType] = useState<ReportType | ''>('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [blockUser, setBlockUser] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reportTypes = reportType === 'bug' ? BUG_REPORT_TYPES : USER_REPORT_TYPES

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 3) {
      toast.error('이미지는 최대 3장까지 첨부할 수 있습니다')
      return
    }
    const newImages = [...images, ...files]
    setImages(newImages)
    setPreviews(newImages.map((f) => URL.createObjectURL(f)))
  }

  const handleImageRemove = (index: number) => {
    const url = previews[index]
    if (url) URL.revokeObjectURL(url)
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!type) {
      toast.error('신고 유형을 선택해주세요')
      return
    }
    if (!description.trim()) {
      toast.error('신고 내용을 입력해주세요')
      return
    }

    setLoading(true)

    let imageUrls: string[] = []
    if (images.length > 0) {
      const { data: uploadData, error: uploadError } = await uploadApi.uploadImages(images)
      if (uploadError || !uploadData) {
        toast.error(uploadError || '이미지 업로드에 실패했습니다')
        setLoading(false)
        return
      }
      imageUrls = uploadData.images.map((img) => img.url)
    }

    const { error } = await reportApi.create({
      type,
      description: description.trim(),
      targetUserId: reportType === 'bug' ? undefined : targetUserId,
      productId,
      imageUrls,
    })

    setLoading(false)

    if (error) {
      toast.error(error)
      return
    }

    if (blockUser && onBlockUser) {
      await onBlockUser()
    }

    toast.success(blockUser ? '신고 접수 및 사용자를 차단했습니다' : '신고가 접수되었습니다')
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setType('')
    setDescription('')
    setBlockUser(false)
    previews.forEach((url) => URL.revokeObjectURL(url))
    setImages([])
    setPreviews([])
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconFlag className="h-5 w-5 text-destructive" />
            {reportType === 'bug' ? '버그 신고' : '사용자 신고'}
          </DialogTitle>
        </DialogHeader>

        {targetUserNickname && (
          <p className="text-sm text-muted-foreground">
            신고 대상: <span className="font-medium text-foreground">{targetUserNickname}</span>
          </p>
        )}

        <div className="space-y-4">
          <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
            <SelectTrigger>
              <SelectValue placeholder="신고 유형 선택" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder={reportType === 'bug' ? '발생한 버그를 자세히 설명해주세요' : '신고 사유를 자세히 설명해주세요'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={4}
          />

          {/* 이미지 첨부 */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleImageAdd}
            />
            {previews.length > 0 && (
              <div className="flex gap-2 mb-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <IconX className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs"
              >
                <IconPhoto className="w-4 h-4" />
                증거 이미지 첨부 ({images.length}/3)
              </Button>
            )}
          </div>
        </div>

        {reportType === 'user' && onBlockUser && (
          <label className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-border px-3 py-2.5 hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={blockUser}
              onChange={(e) => setBlockUser(e.target.checked)}
              className="accent-destructive w-4 h-4"
            />
            <span className="text-sm text-foreground">이 사용자를 차단하기</span>
          </label>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {loading ? <IconLoader2 className="w-4 h-4 animate-spin" /> : '신고하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
