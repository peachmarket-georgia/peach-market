'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { chatApi, checkAuth } from '@/lib/api'
import { ChatRoomDto } from '@/types/api'
import { useSocket } from '@/context/socket-provider'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { IconMessageCircle, IconChevronLeft } from '@tabler/icons-react'

const SYSTEM_MESSAGE_LABELS: Record<string, string> = {
  confirm_request: '거래 확인 중',
  buyer_confirmed: '거래 확인 중',
}

function formatLastMessage(lastMessage: string | null, productTitle: string): string {
  if (!lastMessage) return productTitle
  try {
    const parsed = JSON.parse(lastMessage) as { type?: string }
    if (parsed.type && SYSTEM_MESSAGE_LABELS[parsed.type]) {
      return SYSTEM_MESSAGE_LABELS[parsed.type]!
    }
  } catch {
    // 일반 텍스트 메세지
  }
  return lastMessage
}

export default function ChatListPage() {
  const router = useRouter()
  const { isConnected, connect } = useSocket()
  const [rooms, setRooms] = useState<ChatRoomDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { isAuthenticated, user } = await checkAuth()
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      setCurrentUserId(user?.id || null)
      connect()
      loadRooms()
    }
    init()
  }, [connect, router])

  const loadRooms = async () => {
    const { data, error } = await chatApi.getRooms()
    if (data) {
      setRooms(data)
    }
    setLoading(false)
  }

  const getOtherUser = (room: ChatRoomDto) => {
    return room.buyerId === currentUserId ? room.seller : room.buyer
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-md border-b">
        <button onClick={() => router.push('/marketplace')} className="p-1 -ml-1 rounded-lg hover:bg-accent">
          <IconChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">채팅</h1>
        {isConnected && (
          <span className="ml-auto text-xs text-green-500 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            연결됨
          </span>
        )}
      </header>

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <IconMessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">아직 채팅이 없습니다</p>
          <p className="text-sm text-muted-foreground mt-1">상품에서 채팅하기를 눌러 대화를 시작해보세요</p>
        </div>
      ) : (
        <ul className="divide-y">
          {rooms.map((room) => {
            const otherUser = getOtherUser(room)
            return (
              <li
                key={room.id}
                onClick={() => router.push(`/chat/${room.id}`)}
                className="flex items-center gap-3 p-4 hover:bg-accent cursor-pointer active:bg-accent/80 transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {otherUser.avatarUrl ? (
                    <img src={otherUser.avatarUrl} alt={otherUser.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-semibold text-muted-foreground">
                      {(otherUser.nickname ?? '?')[0]}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{otherUser.nickname}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(room.updatedAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground truncate">
                      {formatLastMessage(room.lastMessage, room.product?.title ?? '삭제된 매물')}
                    </p>
                    {room.unreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full flex-shrink-0">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
