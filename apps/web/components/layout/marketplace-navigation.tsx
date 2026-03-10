'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { BottomNavigation } from './bottom-navigation'
import { FAB } from './fab'
import { checkAuth, chatApi } from '@/lib/api'
import { useSocket } from '@/context/socket-provider'

export function MarketplaceNavigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const { socket } = useSocket()

  // 인증 상태 확인
  useEffect(() => {
    checkAuth().then(({ user }) => {
      setIsAuthenticated(!!user)
      setUserId(user?.id ?? null)
    })
  }, [])

  // 안읽은 채팅 메시지 수 조회
  useEffect(() => {
    if (isAuthenticated) {
      chatApi.getUnreadCount().then(({ data }) => {
        if (data) setUnreadCount(data.count)
      })
    }
  }, [isAuthenticated])

  // 소켓 실시간 unread count 갱신
  useEffect(() => {
    if (!socket || !userId) return

    socket.emit('joinUserRoom', { userId })

    const handleNewUnread = () => setUnreadCount((prev) => prev + 1)
    socket.on('newUnreadMessage', handleNewUnread)

    return () => {
      socket.off('newUnreadMessage', handleNewUnread)
    }
  }, [socket, userId])

  // 채팅 페이지 진입 시 unread count 초기화
  useEffect(() => {
    if (pathname === '/chat' || pathname.startsWith('/chat/')) {
      setUnreadCount(0)
    }
  }, [pathname])

  // 상품 등록/상세 페이지에서는 FAB 숨김 (비로그인도 표시, 클릭 시 로그인 유도)
  const hideFAB =
    pathname === '/marketplace/new' || !!pathname.match(/^\/marketplace\/[^/]+$/) || !!pathname.match(/^\/chat\/.+/)

  return (
    <>
      <BottomNavigation unreadCount={unreadCount} />
      {!hideFAB && <FAB isAuthenticated={isAuthenticated} />}
    </>
  )
}
