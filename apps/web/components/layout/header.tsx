'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import {
  IconSearch,
  IconBell,
  IconPlus,
  IconUser,
  IconLogout,
  IconMessage,
  IconBug,
  IconShield,
  IconMessageReport,
} from '@tabler/icons-react'
import { FeedbackButton as FeedbacklandButton } from 'feedbackland-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { checkAuth, authApi, chatApi } from '@/lib/api'
import { UserProfileResponseDto } from '@/types/api'
import { useSocket } from '@/context/socket-provider'
import { ReportDialog } from '@/components/report-dialog'

type HeaderProps = {
  initialUser?: UserProfileResponseDto | null
}

export function Header({ initialUser }: HeaderProps) {
  const [user, setUser] = useState<UserProfileResponseDto | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [bugReportOpen, setBugReportOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const initialUserRef = useRef(initialUser)
  const router = useRouter()
  const pathname = usePathname()
  const { socket } = useSocket()

  const handleFeedbackClick = () => {
    const btn = feedbackRef.current?.querySelector('button')
    btn?.click()
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // 클라이언트 마운트 후 인증 상태 확인 (SSR 항상 로딩 상태로 고정)
  useEffect(() => {
    if (initialUserRef.current) {
      setUser(initialUserRef.current)
      setLoading(false)
    } else {
      checkAuth().then(({ user }) => {
        setUser(user ?? null)
        setLoading(false)
      })
    }
  }, [])

  // 안읽은 채팅 메시지 수 초기 조회
  useEffect(() => {
    if (user) {
      chatApi.getUnreadCount().then(({ data }) => {
        if (data) setUnreadCount(data.count)
      })
    }
  }, [user])

  // 소켓 개인 채널 join + 실시간 unread count 갱신
  useEffect(() => {
    if (!socket || !user) return

    socket.emit('joinUserRoom', { userId: user.id })

    const handleNewUnread = () => setUnreadCount((prev) => prev + 1)
    socket.on('newUnreadMessage', handleNewUnread)

    return () => {
      socket.off('newUnreadMessage', handleNewUnread)
    }
  }, [socket, user])

  // 채팅 페이지 진입 시 unread count 초기화
  useEffect(() => {
    if (pathname === '/chat' || pathname.startsWith('/chat/')) {
      setUnreadCount(0)
    }
  }, [pathname])

  const handleLogout = async () => {
    await authApi.logout()
    setUser(null)
    router.push('/')
  }

  // 현재 페이지가 활성화된 링크인지 확인
  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* 로고 */}
        <Link href={user ? '/marketplace' : '/'} className="flex items-center gap-2">
          <Image src="/peach_logo_transparent.png" alt="피치마켓" width={32} height={32} />
          <span className="text-lg font-bold text-primary hidden sm:inline">피치마켓</span>
        </Link>

        {/* 네비게이션 */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {loading ? (
            // 로딩 스켈레톤
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
            </div>
          ) : user ? (
            <>
              {/* 검색 */}
              <Link href="/marketplace">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <IconSearch className="w-5 h-5" />
                </Button>
              </Link>

              {/* 채팅 */}
              <Link href="/chat">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`relative ${isActive('/chat') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <IconMessage className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* 알림 */}
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <IconBell className="w-5 h-5" />
              </Button>

              {/* 상품 등록 */}
              <Link href="/marketplace/new">
                <Button size="sm" className="hidden sm:flex gap-1">
                  <IconPlus className="w-4 h-4" />
                  판매하기
                </Button>
                <Button variant="ghost" size="icon" className="sm:hidden text-primary">
                  <IconPlus className="w-5 h-5" />
                </Button>
              </Link>

              {/* 사용자 메뉴 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-1">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <IconUser className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="font-medium text-sm">{user.nickname}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/mypage')}>
                    <IconUser className="w-4 h-4 mr-2" />
                    마이페이지
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/chat')}>
                    <IconMessage className="w-4 h-4 mr-2" />
                    채팅
                    {unreadCount > 0 && (
                      <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFeedbackClick}>
                    <IconMessageReport className="w-4 h-4 mr-2" />
                    피드백 보내기
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBugReportOpen(true)}>
                    <IconBug className="w-4 h-4 mr-2" />
                    버그 신고
                  </DropdownMenuItem>
                  {user.role === 'ADMIN' && (
                    <DropdownMenuItem onClick={() => router.push('/admin')}>
                      <IconShield className="w-4 h-4 mr-2" />
                      관리자
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <IconLogout className="w-4 h-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/marketplace">
                <Button variant="ghost" size="sm">
                  매물 보기
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm">로그인</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
      <ReportDialog open={bugReportOpen} onOpenChange={setBugReportOpen} reportType="bug" />

      {/* 숨겨진 Feedbackland 버튼 (헤더 드롭다운에서 트리거) */}
      {mounted && (
        <div ref={feedbackRef} className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
          <FeedbacklandButton
            platformId="fef1fab9-adbc-4e89-9fe8-338380d84058"
            widget="drawer"
            url="https://peachmarket.feedbackland.com/"
            text="Feedback"
          />
        </div>
      )}
    </header>
  )
}
