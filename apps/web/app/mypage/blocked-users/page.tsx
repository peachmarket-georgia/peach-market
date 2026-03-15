'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IconBan, IconLoader2, IconCircleCheck, IconChevronLeft } from '@tabler/icons-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { userApi } from '@/lib/api'
import type { UserBlockDto } from '@/types/api'

export default function BlockedUsersPage() {
  const router = useRouter()
  const [blocks, setBlocks] = useState<UserBlockDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userApi.getBlockedUsers().then(({ data }) => {
      setBlocks(data ?? [])
      setLoading(false)
    })
  }, [])

  const handleUnblock = async (userId: string, nickname: string) => {
    const { error } = await userApi.unblockUser(userId)
    if (error) {
      toast.error(error)
      return
    }
    toast.success(`${nickname}님 차단이 해제되었습니다`)
    setBlocks((prev) => prev.filter((b) => b.blocked.id !== userId))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
      <button
        onClick={() => router.push('/mypage')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <IconChevronLeft className="h-4 w-4" />
        마이페이지
      </button>

      <div className="flex items-center gap-2 mb-6">
        <IconBan className="h-5 w-5 text-destructive" />
        <h1 className="text-lg font-bold">차단한 사용자</h1>
      </div>

      {blocks.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">차단한 사용자가 없습니다</p>
      ) : (
        <div className="space-y-2">
          {blocks.map((block) => (
            <div key={block.id} className="border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {block.blocked.avatarUrl ? (
                  <img
                    src={block.blocked.avatarUrl}
                    alt={block.blocked.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">{block.blocked.nickname[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{block.blocked.nickname}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(block.createdAt).toLocaleDateString('ko-KR')} 차단
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnblock(block.blocked.id, block.blocked.nickname)}
                className="gap-1 text-xs"
              >
                <IconCircleCheck className="w-3.5 h-3.5" />
                해제
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
