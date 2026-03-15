'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  IconLoader2,
  IconSearch,
  IconBan,
  IconCircleCheck,
  IconShield,
  IconShieldOff,
  IconFlag,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { AdminUserDto } from '@/types/api'

type PendingAction = {
  type: 'block' | 'unblock' | 'promote' | 'demote'
  user: AdminUserDto
}

const ACTION_CONFIG: Record<string, { title: string; description: (name: string) => string; confirmLabel: string }> = {
  block: {
    title: '사용자 차단',
    description: (name) => `${name}님을 차단하시겠습니까? 차단된 사용자는 로그인할 수 없으며 상품이 숨겨집니다.`,
    confirmLabel: '차단',
  },
  unblock: {
    title: '차단 해제',
    description: (name) => `${name}님의 차단을 해제하시겠습니까?`,
    confirmLabel: '해제',
  },
  promote: {
    title: '관리자 권한 부여',
    description: (name) => `${name}님에게 관리자 권한을 부여하시겠습니까?`,
    confirmLabel: '부여',
  },
  demote: {
    title: '관리자 권한 해제',
    description: (name) => `${name}님의 관리자 권한을 해제하시겠습니까?`,
    confirmLabel: '해제',
  },
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const fetchUsers = useCallback((searchTerm?: string) => {
    setLoading(true)
    const params = searchTerm ? { search: searchTerm } : undefined
    adminApi.getUsers(params).then(({ data }) => {
      setUsers(data ?? [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(search)
  }

  const handleConfirm = async () => {
    if (!pendingAction) return

    const { type, user } = pendingAction
    const actions = {
      block: adminApi.blockUser,
      unblock: adminApi.unblockUser,
      promote: adminApi.promoteUser,
      demote: adminApi.demoteUser,
    }
    const result = await actions[type](user.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(ACTION_CONFIG[type]!.title + ' 완료')
      fetchUsers(search)
    }
    setPendingAction(null)
  }

  return (
    <div>
      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="닉네임 또는 이메일 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          검색
        </Button>
      </form>

      {/* 사용자 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">사용자를 찾을 수 없습니다</p>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">{user.nickname[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/admin/users/${user.id}`} className="font-medium text-sm truncate hover:underline">
                    {user.nickname}
                  </Link>
                  {user.role === 'ADMIN' && <Badge className="text-xs bg-primary/20 text-primary">관리자</Badge>}
                  {user.isBlocked && (
                    <Badge variant="destructive" className="text-xs">
                      차단됨
                    </Badge>
                  )}
                  {user.reportCount > 0 && (
                    <Badge variant="outline" className="text-xs gap-0.5 text-orange-600 border-orange-200">
                      <IconFlag className="w-3 h-3" />
                      신고 {user.reportCount}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {user.isBlocked ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingAction({ type: 'unblock', user })}
                    className="gap-1 text-xs"
                  >
                    <IconCircleCheck className="w-3.5 h-3.5" />
                    해제
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingAction({ type: 'block', user })}
                    className="gap-1 text-xs text-destructive hover:text-destructive"
                  >
                    <IconBan className="w-3.5 h-3.5" />
                    차단
                  </Button>
                )}
                {user.role === 'ADMIN' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingAction({ type: 'demote', user })}
                    className="gap-1 text-xs"
                  >
                    <IconShieldOff className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingAction({ type: 'promote', user })}
                    className="gap-1 text-xs"
                  >
                    <IconShield className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 확인 다이얼로그 */}
      <AlertDialog open={!!pendingAction} onOpenChange={(o) => !o && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingAction ? ACTION_CONFIG[pendingAction.type]!.title : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction ? ACTION_CONFIG[pendingAction.type]!.description(pendingAction.user.nickname) : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={pendingAction?.type === 'block' ? 'bg-destructive text-white hover:bg-destructive/90' : ''}
            >
              {pendingAction ? ACTION_CONFIG[pendingAction.type]!.confirmLabel : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
