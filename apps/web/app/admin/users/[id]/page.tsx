'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import Link from 'next/link'
import {
  IconChevronLeft,
  IconLoader2,
  IconBan,
  IconCircleCheck,
  IconShield,
  IconShieldOff,
  IconFlag,
  IconPackage,
  IconUserOff,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import type { AdminUserDetailDto } from '@/types/api'

const REPORT_TYPE_LABEL: Record<string, string> = {
  SCAM: '사기',
  INAPPROPRIATE: '부적절',
  SPAM: '스팸',
  NO_SHOW: '노쇼',
  COMMERCIAL_SELLER: '업자',
  PROFANITY: '욕설',
  EXPLICIT_CONTENT: '음란물',
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

export default function AdminUserDetailPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<AdminUserDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState<'block' | 'unblock' | 'promote' | 'demote' | null>(null)

  const fetchUser = () => {
    adminApi.getUser(id).then(({ data }) => {
      setUser(data ?? null)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchUser()
  }, [id])

  const handleConfirm = async () => {
    if (!confirmAction || !user) return
    const actions = {
      block: adminApi.blockUser,
      unblock: adminApi.unblockUser,
      promote: adminApi.promoteUser,
      demote: adminApi.demoteUser,
    }
    const labels = { block: '차단', unblock: '차단 해제', promote: '관리자 권한 부여', demote: '관리자 권한 해제' }
    const { error } = await actions[confirmAction](user.id)
    if (error) {
      toast.error(error)
    } else {
      toast.success(`${labels[confirmAction]} 완료`)
      fetchUser()
    }
    setConfirmAction(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return <p className="text-center text-muted-foreground py-12">사용자를 찾을 수 없습니다</p>
  }

  return (
    <div>
      <button
        onClick={() => router.push('/admin/users')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <IconChevronLeft className="h-4 w-4" />
        목록으로
      </button>

      {/* 기본 정보 */}
      <div className="border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-muted-foreground">{user.nickname[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold truncate">{user.nickname}</h2>
              {user.role === 'ADMIN' && <Badge className="text-xs bg-primary/20 text-primary">관리자</Badge>}
              {user.isBlocked && (
                <Badge variant="destructive" className="text-xs">
                  차단됨
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">{user.location}</p>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">매너점수</p>
            <p className="text-lg font-bold">{user.mannerScore}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">등록 상품</p>
            <p className="text-lg font-bold flex items-center justify-center gap-1">
              <IconPackage className="w-4 h-4 text-muted-foreground" />
              {user.productCount}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">받은 신고</p>
            <p className="text-lg font-bold flex items-center justify-center gap-1">
              <IconFlag className="w-4 h-4 text-orange-500" />
              {user.reportCount}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">사용자 차단</p>
            <p className="text-lg font-bold flex items-center justify-center gap-1">
              <IconUserOff className="w-4 h-4 text-rose-500" />
              {user.blockCount}
            </p>
          </div>
        </div>

        {/* 가입일 */}
        <p className="text-xs text-muted-foreground">가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>

        {/* 액션 버튼 */}
        <div className="flex gap-2 mt-4">
          {user.isBlocked ? (
            <Button variant="outline" size="sm" onClick={() => setConfirmAction('unblock')} className="gap-1">
              <IconCircleCheck className="w-4 h-4" />
              차단 해제
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmAction('block')}
              className="gap-1 text-destructive hover:text-destructive"
            >
              <IconBan className="w-4 h-4" />
              차단
            </Button>
          )}
          {user.role === 'ADMIN' ? (
            <Button variant="outline" size="sm" onClick={() => setConfirmAction('demote')} className="gap-1">
              <IconShieldOff className="w-4 h-4" />
              관리자 해제
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmAction('promote')} className="gap-1">
              <IconShield className="w-4 h-4" />
              관리자 부여
            </Button>
          )}
        </div>
      </div>

      {/* 피신고 이력 */}
      <div className="border rounded-xl p-5">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <IconFlag className="w-4 h-4 text-orange-500" />
          받은 신고 이력
        </h3>

        {user.reportsReceived.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">받은 신고가 없습니다</p>
        ) : (
          <div className="space-y-2">
            {user.reportsReceived.map((report) => (
              <Link key={report.id} href={`/admin/reports/${report.id}`}>
                <div className="border rounded-lg p-3 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {REPORT_TYPE_LABEL[report.type]}
                    </Badge>
                    <Badge
                      className={cn(
                        'text-xs',
                        report.status === 'PENDING' && 'bg-warning/20 text-warning',
                        report.status === 'REVIEWING' && 'bg-blue-100 text-blue-700',
                        report.status === 'RESOLVED' && 'bg-success/20 text-success',
                        report.status === 'DISMISSED' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {STATUS_LABEL[report.status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-1">{report.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">신고자: {report.reporter.nickname}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 확인 다이얼로그 */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'block' && '사용자 차단'}
              {confirmAction === 'unblock' && '차단 해제'}
              {confirmAction === 'promote' && '관리자 권한 부여'}
              {confirmAction === 'demote' && '관리자 권한 해제'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'block' &&
                `${user.nickname}님을 차단하시겠습니까? 차단된 사용자는 로그인할 수 없으며 상품이 숨겨집니다.`}
              {confirmAction === 'unblock' && `${user.nickname}님의 차단을 해제하시겠습니까?`}
              {confirmAction === 'promote' && `${user.nickname}님에게 관리자 권한을 부여하시겠습니까?`}
              {confirmAction === 'demote' && `${user.nickname}님의 관리자 권한을 해제하시겠습니까?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={confirmAction === 'block' ? 'bg-destructive text-white hover:bg-destructive/90' : ''}
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
