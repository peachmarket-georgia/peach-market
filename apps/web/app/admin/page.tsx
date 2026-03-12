'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  IconUsers,
  IconUserPlus,
  IconUserOff,
  IconPackage,
  IconPackages,
  IconFlag,
  IconAlertTriangle,
  IconEye,
  IconLoader2,
  IconArrowRight,
} from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { adminApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { AdminStatsDto } from '@/types/api'

const STATUS_LABEL: Record<string, string> = {
  PENDING: '대기중',
  REVIEWING: '검토중',
  RESOLVED: '처리완료',
  DISMISSED: '기각',
}

const REPORT_TYPE_LABEL: Record<string, string> = {
  SCAM: '사기',
  INAPPROPRIATE: '부적절',
  SPAM: '스팸',
  BUG: '버그',
  OTHER: '기타',
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getStats().then(({ data }) => {
      setStats(data ?? null)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-2">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (!stats) {
    return <p className="text-center text-muted-foreground py-12">통계를 불러올 수 없습니다</p>
  }

  const statCards = [
    {
      label: '총 사용자',
      value: stats.users.total,
      icon: IconUsers,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '신규 가입 (7일)',
      value: stats.users.newLast7Days,
      icon: IconUserPlus,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: '차단된 사용자',
      value: stats.users.blocked,
      icon: IconUserOff,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: '총 상품',
      value: stats.products.total,
      icon: IconPackages,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: '활성 상품',
      value: stats.products.active,
      icon: IconPackage,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: '총 신고',
      value: stats.reports.total,
      icon: IconFlag,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <div className={cn('p-1.5 rounded-lg', stat.bg)}>
                  <stat.icon className={cn('h-4 w-4', stat.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 처리 필요 알림 */}
      {(stats.reports.pending > 0 || stats.reports.reviewing > 0) && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-2">
            <div className="flex items-center gap-2 mb-2">
              <IconAlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">처리 필요</span>
            </div>
            <div className="flex gap-4 text-sm">
              {stats.reports.pending > 0 && (
                <Link href="/admin/reports" className="text-warning hover:underline">
                  대기중 신고 {stats.reports.pending}건
                </Link>
              )}
              {stats.reports.reviewing > 0 && (
                <Link href="/admin/reports" className="text-blue-600 hover:underline">
                  검토중 신고 {stats.reports.reviewing}건
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 최근 신고 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">최근 신고</h2>
          <Link
            href="/admin/reports"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            전체보기 <IconArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {stats.recentReports.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">신고가 없습니다</p>
        ) : (
          <div className="space-y-2">
            {stats.recentReports.map((report) => (
              <Link key={report.id} href={`/admin/reports/${report.id}`}>
                <div className="border rounded-xl p-3 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
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
                      </div>
                      <p className="text-sm text-foreground line-clamp-1">{report.description}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>신고자: {report.reporter.nickname}</span>
                        {report.targetUser && <span>대상: {report.targetUser.nickname}</span>}
                        <span>{new Date(report.createdAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                    <IconEye className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
