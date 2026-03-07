'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { IconChevronLeft, IconLoader2, IconBan } from '@tabler/icons-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { adminApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { AdminReportDto, ReportStatus } from '@/types/api'

const REPORT_TYPE_LABEL: Record<string, string> = {
  SCAM: '사기',
  INAPPROPRIATE: '부적절한 행동',
  SPAM: '스팸',
  BUG: '버그',
  OTHER: '기타',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: '대기중',
  REVIEWING: '검토중',
  RESOLVED: '처리완료',
  DISMISSED: '기각',
}

type Props = {
  params: Promise<{ id: string }>
}

export default function AdminReportDetailPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const [report, setReport] = useState<AdminReportDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<ReportStatus>('PENDING')
  const [adminNote, setAdminNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [blockConfirm, setBlockConfirm] = useState(false)

  useEffect(() => {
    adminApi.getReport(id).then(({ data }) => {
      if (data) {
        setReport(data)
        setStatus(data.status)
        setAdminNote(data.adminNote ?? '')
      }
      setLoading(false)
    })
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    const { data, error } = await adminApi.updateReport(id, { status, adminNote })
    setSaving(false)
    if (error) {
      toast.error(error)
      return
    }
    if (data) setReport(data)
    toast.success('신고가 업데이트되었습니다')
  }

  const handleBlock = async () => {
    if (!report?.targetUser) return
    const { error } = await adminApi.blockUser(report.targetUser.id)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('사용자가 차단되었습니다')
    setBlockConfirm(false)
    // 리로드
    const { data } = await adminApi.getReport(id)
    if (data) setReport(data)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!report) {
    return <p className="text-center text-muted-foreground py-12">신고를 찾을 수 없습니다</p>
  }

  return (
    <div>
      <button
        onClick={() => router.push('/admin/reports')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <IconChevronLeft className="h-4 w-4" />
        목록으로
      </button>

      <div className="border rounded-xl p-5 space-y-5">
        {/* 기본 정보 */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{REPORT_TYPE_LABEL[report.type]}</Badge>
          <Badge
            className={cn(
              report.status === 'PENDING' && 'bg-warning/20 text-warning',
              report.status === 'REVIEWING' && 'bg-blue-100 text-blue-700',
              report.status === 'RESOLVED' && 'bg-success/20 text-success',
              report.status === 'DISMISSED' && 'bg-muted text-muted-foreground'
            )}
          >
            {STATUS_LABEL[report.status]}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(report.createdAt).toLocaleString('ko-KR')}
          </span>
        </div>

        {/* 신고자 / 대상 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">신고자</p>
            <p className="font-medium text-sm">{report.reporter.nickname}</p>
            <p className="text-xs text-muted-foreground">{report.reporter.email}</p>
          </div>
          {report.targetUser && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">피신고자</p>
              <p className="font-medium text-sm">
                {report.targetUser.nickname}
                {report.targetUser.isBlocked && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    차단됨
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{report.targetUser.email}</p>
            </div>
          )}
        </div>

        {/* 설명 */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">신고 내용</p>
          <p className="text-sm whitespace-pre-wrap bg-muted/20 rounded-lg p-3">{report.description}</p>
        </div>

        {/* 증거 이미지 */}
        {report.imageUrls.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">증거 이미지</p>
            <div className="flex gap-2 flex-wrap">
              {report.imageUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`증거 ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 관리자 처리 */}
        <div className="border-t pt-5 space-y-3">
          <div className="flex items-center gap-3">
            <Select value={status} onValueChange={(v) => setStatus(v as ReportStatus)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">대기중</SelectItem>
                <SelectItem value="REVIEWING">검토중</SelectItem>
                <SelectItem value="RESOLVED">처리완료</SelectItem>
                <SelectItem value="DISMISSED">기각</SelectItem>
              </SelectContent>
            </Select>

            {report.targetUser && !report.targetUser.isBlocked && (
              <Button variant="destructive" size="sm" onClick={() => setBlockConfirm(true)} className="gap-1">
                <IconBan className="w-4 h-4" />
                사용자 차단
              </Button>
            )}
          </div>

          <Textarea
            placeholder="관리자 메모"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            maxLength={500}
            rows={3}
          />

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <IconLoader2 className="w-4 h-4 animate-spin" /> : '저장'}
          </Button>
        </div>
      </div>

      {/* 차단 확인 다이얼로그 */}
      <AlertDialog open={blockConfirm} onOpenChange={setBlockConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사용자 차단</AlertDialogTitle>
            <AlertDialogDescription>
              {report.targetUser?.nickname}님을 차단하시겠습니까? 차단된 사용자는 로그인할 수 없으며 상품이 목록에서
              숨겨집니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} className="bg-destructive text-white hover:bg-destructive/90">
              차단
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
