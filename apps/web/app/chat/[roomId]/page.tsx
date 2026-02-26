'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSocket } from '@/context/socket-provider'
import { chatApi, checkAuth } from '@/lib/api'
import { productApi } from '@/lib/products-api'
import { ChatMessageDto, ChatRoomWithMessagesDto } from '@/types/api'
import { STATUS_LABEL } from '@/lib/product-types'
import type { ProductStatus } from '@/lib/product-types'
import { cn } from '@/lib/utils'
import { IconChevronLeft, IconSend, IconDotsVertical } from '@tabler/icons-react'

export default function ChatRoomPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string

  const { socket, isConnected, isReconnecting, connect } = useSocket()
  const [chatRoom, setChatRoom] = useState<ChatRoomWithMessagesDto | null>(null)
  const [messages, setMessages] = useState<ChatMessageDto[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [productStatus, setProductStatus] = useState<ProductStatus>('SELLING')
  const [statusLoading, setStatusLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load user and connect socket
  useEffect(() => {
    const init = async () => {
      const { isAuthenticated, user } = await checkAuth()
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      setCurrentUserId(user?.id || null)
      connect()
    }
    init()
  }, [connect, router])

  // Load chat room data
  useEffect(() => {
    const loadRoom = async () => {
      const { data, error } = await chatApi.getRoom(roomId)
      if (error) {
        router.push('/chat')
        return
      }
      if (data) {
        setChatRoom(data)
        setMessages(data.messages)
        setProductStatus(data.product.status as ProductStatus)
      }
      setLoading(false)
    }
    loadRoom()
  }, [roomId, router])

  const handleStatusChange = async (newStatus: ProductStatus) => {
    if (statusLoading || !chatRoom) return
    setStatusLoading(true)
    const { data } = await productApi.updateProductStatus(chatRoom.product.id, newStatus)
    if (data) setProductStatus(data.status as ProductStatus)
    setStatusLoading(false)
  }

  // Join room when connected
  useEffect(() => {
    if (socket && isConnected && roomId && currentUserId) {
      socket.emit('joinRoom', { roomId, userId: currentUserId })
    }

    return () => {
      if (socket && roomId) {
        socket.emit('leaveRoom', roomId)
      }
    }
  }, [socket, isConnected, roomId, currentUserId])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (msg: ChatMessageDto) => {
      setMessages((prev) => [...prev, msg])
      // Mark as read if we're viewing
      socket.emit('markAsRead', { chatRoomId: roomId })
    }

    const handleUserTyping = ({ userId }: { userId: string }) => {
      if (userId !== currentUserId) {
        setTypingUser(userId)
      }
    }

    const handleUserStoppedTyping = () => {
      setTypingUser(null)
    }

    socket.on('newMessage', handleNewMessage)
    socket.on('userTyping', handleUserTyping)
    socket.on('userStoppedTyping', handleUserStoppedTyping)

    return () => {
      socket.off('newMessage', handleNewMessage)
      socket.off('userTyping', handleUserTyping)
      socket.off('userStoppedTyping', handleUserStoppedTyping)
    }
  }, [socket, roomId, currentUserId])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleTyping = useCallback(() => {
    if (!socket || !roomId) return

    if (!isTyping) {
      setIsTyping(true)
      socket.emit('typing', { chatRoomId: roomId })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket.emit('stopTyping', { chatRoomId: roomId })
    }, 2000)
  }, [socket, roomId, isTyping])

  const handleSend = () => {
    if (!socket || !newMessage.trim() || !currentUserId) return

    socket.emit('sendMessage', {
      chatRoomId: roomId,
      senderId: currentUserId,
      content: newMessage.trim(),
    })

    setNewMessage('')
    setIsTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    socket.emit('stopTyping', { chatRoomId: roomId })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading || !chatRoom || !currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-primary font-medium">로딩 중...</div>
      </div>
    )
  }

  const otherUser = chatRoom.buyerId === currentUserId ? chatRoom.seller : chatRoom.buyer

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-3 py-2.5 bg-primary">
        <button onClick={() => router.push('/chat')} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
          <IconChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center overflow-hidden flex-shrink-0">
            {otherUser.avatarUrl ? (
              <img src={otherUser.avatarUrl} alt={otherUser.nickname} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white">{otherUser.nickname[0]}</span>
            )}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-sm truncate block text-white">{otherUser.nickname}</span>
            <span className="text-xs text-white/70">
              {typingUser ? <span className="text-white font-medium">입력 중...</span> : '온라인'}
            </span>
          </div>
        </div>

        <button className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
          <IconDotsVertical className="w-5 h-5 text-white" />
        </button>
      </header>

      {/* Connection Status Banner */}
      {!isConnected && (
        <div className="bg-destructive/10 text-destructive text-center text-xs py-1.5 px-4 font-medium">
          {isReconnecting ? '재연결 중...' : '연결이 끊어졌습니다'}
        </div>
      )}

      {/* Product Card */}
      <div className="border-b border-primary/15 bg-primary/5">
        {/* Product Info Row */}
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-muted shrink-0">
            {chatRoom.product.images[0] ? (
              <img
                src={chatRoom.product.images[0]}
                alt={chatRoom.product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                No Image
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span
              className={cn(
                'inline-block px-1.5 py-0.5 text-[10px] font-bold rounded-md mb-0.5',
                productStatus === 'PENDING' && 'bg-[#DBEAFE] text-[#1E40AF]',
                productStatus === 'SELLING' && 'bg-[#DCFCE7] text-[#166534]',
                productStatus === 'RESERVED' && 'bg-[#FEF9C3] text-[#854D0E]',
                productStatus === 'CONFIRMED' && 'bg-[#F3E8FF] text-[#6B21A8]',
                productStatus === 'ENDED' && 'bg-[#F3F4F6] text-[#6B7280]'
              )}
            >
              {STATUS_LABEL[productStatus]}
            </span>
            <p className="text-sm font-medium truncate">{chatRoom.product.title}</p>
            <p className="text-sm font-bold text-primary">${(chatRoom.product.price / 100).toFixed(2)}</p>
          </div>
        </div>

        {/* 판매자 전용 상태 변경 버튼 - 가로 스크롤 행 */}
        {currentUserId === chatRoom.sellerId && (
          <div className="flex gap-1.5 px-3 pb-2.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {productStatus !== 'PENDING' && (
              <button
                onClick={() => handleStatusChange('PENDING')}
                disabled={statusLoading}
                className="shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-full border border-[#1E40AF]/30 text-[#1E40AF] bg-[#DBEAFE]/60 hover:bg-[#DBEAFE] transition-colors disabled:opacity-50"
              >
                판매대기
              </button>
            )}
            {productStatus !== 'SELLING' && (
              <button
                onClick={() => handleStatusChange('SELLING')}
                disabled={statusLoading}
                className="shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-full border border-[#166534]/30 text-[#166534] bg-[#DCFCE7]/60 hover:bg-[#DCFCE7] transition-colors disabled:opacity-50"
              >
                판매중
              </button>
            )}
            {productStatus !== 'RESERVED' && (
              <button
                onClick={() => handleStatusChange('RESERVED')}
                disabled={statusLoading}
                className="shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-full border border-[#854D0E]/30 text-[#854D0E] bg-[#FEF9C3]/60 hover:bg-[#FEF9C3] transition-colors disabled:opacity-50"
              >
                예약중
              </button>
            )}
            {productStatus !== 'CONFIRMED' && (
              <button
                onClick={() => handleStatusChange('CONFIRMED')}
                disabled={statusLoading}
                className="shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-full border border-[#6B21A8]/30 text-[#6B21A8] bg-[#F3E8FF]/60 hover:bg-[#F3E8FF] transition-colors disabled:opacity-50"
              >
                판매확정
              </button>
            )}
            {productStatus !== 'ENDED' && (
              <button
                onClick={() => handleStatusChange('ENDED')}
                disabled={statusLoading}
                className="shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-full border border-[#6B7280]/30 text-[#6B7280] bg-[#F3F4F6]/60 hover:bg-[#F3F4F6] transition-colors disabled:opacity-50"
              >
                판매종료
              </button>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">아직 메시지가 없어요</p>
              <p className="text-muted-foreground/60 text-xs mt-1">먼저 인사를 건네보세요 👋</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex flex-col gap-0.5 max-w-[78%]',
                msg.senderId === currentUserId ? 'ml-auto items-end' : 'mr-auto items-start'
              )}
            >
              <div
                className={cn(
                  'px-3.5 py-2 text-[14px] leading-relaxed rounded-2xl',
                  msg.senderId === currentUserId
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-primary/10 text-foreground rounded-bl-md'
                )}
              >
                {msg.content}
              </div>
              <span className="text-[11px] text-muted-foreground px-1">
                {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))
        )}

        {/* 타이핑 인디케이터 */}
        {typingUser && (
          <div className="mr-auto flex items-center gap-1 px-3.5 py-3 bg-primary/10 rounded-2xl rounded-bl-md w-fit">
            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-primary/15 px-3 py-2.5 safe-area-pb">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            onKeyDown={handleKeyDown}
            disabled={!isConnected}
            placeholder={isConnected ? '메시지를 입력하세요...' : '연결 중...'}
            className="flex-1 px-4 py-2.5 bg-primary/10 border border-primary rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || !isConnected}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all',
              newMessage.trim() && isConnected
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground scale-95'
            )}
          >
            <IconSend className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
