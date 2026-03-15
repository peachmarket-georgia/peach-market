'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { IconLoader2 } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { AdminReportDto, ReportStatus } from '@/types/api'

const STATUS_TABS: { value: ReportStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '대기중' },
  { value: 'REVIEWING', label: '검토중' },
  { value: 'RESOLVED', label: '처리완료' },
  { value: 'DISMISSED', label: '기각' },
]

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

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReportDto[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('')

  useEffect(() => {
    setLoading(true)
    const params: { type?: string; status?: string } = {}
    if (typeFilter) params.type = typeFilter
    if (statusFilter !== 'ALL') params.status = statusFilter

    adminApi.getReports(params).then(({ data }) => {
      setReports(data ?? [])
      setLoading(false)
    })
  }, [statusFilter, typeFilter])

  return (
    <div>
      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors',
                statusFilter === tab.value
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="유형 전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            <SelectItem value="SCAM">사기</SelectItem>
            <SelectItem value="INAPPROPRIATE">부적절</SelectItem>
            <SelectItem value="SPAM">스팸</SelectItem>
            <SelectItem value="NO_SHOW">노쇼</SelectItem>
            <SelectItem value="COMMERCIAL_SELLER">업자</SelectItem>
            <SelectItem value="PROFANITY">욕설</SelectItem>
            <SelectItem value="EXPLICIT_CONTENT">음란물</SelectItem>
            <SelectItem value="BUG">버그</SelectItem>
            <SelectItem value="OTHER">기타</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">신고가 없습니다</p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link key={report.id} href={`/admin/reports/${report.id}`}>
              <div className="border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
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
                    <p className="text-sm text-foreground line-clamp-2 mb-1">{report.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>신고자: {report.reporter.nickname}</span>
                      {report.targetUser && <span>대상: {report.targetUser.nickname}</span>}
                      <span>{new Date(report.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
