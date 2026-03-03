'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSocket } from '@/context/socket-provider'
import { chatApi, checkAuth } from '@/lib/api'
import { productApi } from '@/lib/products-api'
import { reservationApi } from '@/lib/reservation-api'
import { ChatMessageDto, ChatRoomWithMessagesDto } from '@/types/api'
import type { ReservationDto } from '@/types/reservation'
import { STATUS_LABEL } from '@/lib/product-types'
import type { ProductStatus } from '@/lib/product-types'
import { cn } from '@/lib/utils'
import { IconChevronLeft, IconSend, IconDotsVertical } from '@tabler/icons-react'
import { toast } from 'sonner'

type PendingAction = ProductStatus | 'confirm' | 'cancel'

const MODAL_CONFIG: Record<PendingAction, { title: string; description: string }> = {
  SELLING: { title: '판매중으로 변경', description: '상품이 다시 판매중 상태로 변경됩니다.' },
  RESERVED: { title: '예약중으로 변경', description: '현재 대화 상대와 예약이 생성됩니다.' },
  ENDED: { title: '판매 종료', description: '상품을 판매종료 상태로 변경합니다.' },
  CONFIRMED: { title: '판매완료', description: '' },
  confirm: { title: '거래 완료 처리', description: '거래를 완료하시겠습니까?\n상품이 판매완료 상태로 변경됩니다.' },
  cancel: { title: '예약 취소', description: '예약을 취소하시겠습니까?\n상품이 다시 판매중으로 변경됩니다.' },
}

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
  const [reservation, setReservation] = useState<ReservationDto | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const productDeleted = chatRoom !== null && chatRoom.product === null
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

  // Load chat room data + active reservation
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
        if (data.product) setProductStatus(data.product.status as ProductStatus)

        const { data: resData } = data.product ? await reservationApi.getByProduct(data.product.id) : { data: null }
        if (resData) setReservation(resData)
      }
      setLoading(false)
    }
    loadRoom()
  }, [roomId, router])

  const emitStatusUpdate = useCallback(
    (newStatus: ProductStatus) => {
      socket?.emit('productStatusUpdate', { chatRoomId: roomId, status: newStatus })
    },
    [socket, roomId]
  )

  /** 상태 변경 실행 (모달 확인 후 호출) */
  const executeAction = async () => {
    if (!pendingAction || statusLoading || !chatRoom) return
    setStatusLoading(true)
    setPendingAction(null)

    if (pendingAction === 'RESERVED') {
      if (!chatRoom.product) {
        setStatusLoading(false)
        return
      }
      const { data } = await reservationApi.create(chatRoom.product.id, chatRoom.buyerId)
      if (data) {
        setReservation(data)
        setProductStatus('RESERVED')
        emitStatusUpdate('RESERVED')
      }
    } else if (pendingAction === 'confirm') {
      if (!reservation) {
        setStatusLoading(false)
        return
      }
      const { data } = await reservationApi.confirm(reservation.id)
      if (data) {
        setReservation(data)
        setProductStatus('CONFIRMED')
        emitStatusUpdate('CONFIRMED')
      }
    } else if (pendingAction === 'cancel') {
      if (!reservation) {
        setStatusLoading(false)
        return
      }
      const { data } = await reservationApi.cancel(reservation.id)
      if (data) {
        setReservation(data)
        setProductStatus('SELLING')
        emitStatusUpdate('SELLING')
      }
    } else {
      if (!chatRoom.product) {
        setStatusLoading(false)
        return
      }
      const { data } = await productApi.updateProductStatus(chatRoom.product.id, pendingAction)
      if (data) {
        setProductStatus(data.status as ProductStatus)
        emitStatusUpdate(data.status as ProductStatus)
      }
    }

    setStatusLoading(false)
  }

  // Join room when connected + 입장 시 읽음 처리
  useEffect(() => {
    if (socket && isConnected && roomId && currentUserId) {
      socket.emit('joinRoom', { roomId, userId: currentUserId })
      socket.emit('markAsRead', { chatRoomId: roomId, userId: currentUserId })
    }
    return () => {
      if (socket && roomId) socket.emit('leaveRoom', roomId)
    }
  }, [socket, isConnected, roomId, currentUserId])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (msg: ChatMessageDto) => {
      setMessages((prev) => [...prev, msg])
      if (currentUserId) socket.emit('markAsRead', { chatRoomId: roomId, userId: currentUserId })
    }
    const handleUserTyping = ({ userId }: { userId: string }) => {
      if (userId !== currentUserId) setTypingUser(userId)
    }
    const handleUserStoppedTyping = () => setTypingUser(null)
    const handleProductStatusUpdated = ({ status }: { status: ProductStatus }) => {
      setProductStatus(status)
    }

    socket.on('newMessage', handleNewMessage)
    socket.on('userTyping', handleUserTyping)
    socket.on('userStoppedTyping', handleUserStoppedTyping)
    socket.on('productStatusUpdated', handleProductStatusUpdated)

    return () => {
      socket.off('newMessage', handleNewMessage)
      socket.off('userTyping', handleUserTyping)
      socket.off('userStoppedTyping', handleUserStoppedTyping)
      socket.off('productStatusUpdated', handleProductStatusUpdated)
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

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

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
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    socket.emit('stopTyping', { chatRoomId: roomId })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return
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
  const isSeller = currentUserId === chatRoom.sellerId
  const completedReservation = reservation?.status === 'COMPLETED'

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-3 py-2.5 bg-primary">
        <button onClick={() => router.push('/chat')} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
          <IconChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center overflow-hidden shrink-0">
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
        <div
          className="flex items-center gap-3 px-3 py-3 cursor-pointer active:bg-primary/10 transition-colors"
          onClick={() =>
            productDeleted ? toast.error('삭제된 매물입니다') : router.push(`/marketplace/${chatRoom.product!.id}`)
          }
        >
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-muted shrink-0">
            {chatRoom.product?.images[0] ? (
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
            {productDeleted ? (
              <p className="text-sm text-fg-tertiary italic">삭제된 매물입니다</p>
            ) : (
              <>
                <span
                  className={cn(
                    'inline-block px-1.5 py-0.5 text-[10px] font-bold rounded-md mb-0.5',
                    productStatus === 'SELLING' && 'bg-success-subtle text-success',
                    productStatus === 'RESERVED' && 'bg-warning-subtle text-warning',
                    productStatus === 'CONFIRMED' && 'bg-success-subtle text-success',
                    productStatus === 'ENDED' && 'bg-muted text-muted-foreground'
                  )}
                >
                  {STATUS_LABEL[productStatus]}
                </span>
                <p className="text-sm font-medium truncate">{chatRoom.product!.title}</p>
                <p className="text-sm font-bold text-primary">${chatRoom.product!.price.toLocaleString('en-US')}</p>
              </>
            )}
          </div>
        </div>

        {/* 판매자 상태 변경 버튼 — 상품이 존재할 때만 */}
        {isSeller && !productDeleted && productStatus !== 'CONFIRMED' && (
          <div className="flex gap-2 px-3 pb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {productStatus === 'SELLING' && (
              <>
                <button
                  onClick={() => setPendingAction('RESERVED')}
                  disabled={statusLoading}
                  className="shrink-0 px-4 py-2 text-xs font-bold rounded-xl bg-warning text-white shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  예약중으로 변경
                </button>
                <button
                  onClick={() => setPendingAction('ENDED')}
                  disabled={statusLoading}
                  className="shrink-0 px-4 py-2 text-xs font-bold rounded-xl bg-surface-tertiary text-fg-secondary shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  판매종료
                </button>
              </>
            )}
            {productStatus === 'RESERVED' && (
              <>
                <button
                  onClick={() => setPendingAction('confirm')}
                  disabled={statusLoading}
                  className="shrink-0 px-4 py-2 text-xs font-bold rounded-xl bg-success text-white shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  거래완료 처리
                </button>
                <button
                  onClick={() => setPendingAction('cancel')}
                  disabled={statusLoading}
                  className="shrink-0 px-4 py-2 text-xs font-bold rounded-xl bg-surface-tertiary text-fg-secondary shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  예약취소
                </button>
              </>
            )}
            {productStatus === 'ENDED' && (
              <button
                onClick={() => setPendingAction('SELLING')}
                disabled={statusLoading}
                className="shrink-0 px-4 py-2 text-xs font-bold rounded-xl bg-success text-white shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                판매중으로 변경
              </button>
            )}
          </div>
        )}
      </div>

      {/* 거래 완료 배너 */}
      {completedReservation && reservation && (
        <div className="border-b border-[#166534]/15 bg-[#DCFCE7]/60 px-3 py-2.5 text-center">
          <p className="text-sm font-bold text-[#166534]">거래가 완료되었습니다 🎉</p>
          {reservation.completedAt && (
            <p className="text-[11px] text-[#166534]/70 mt-0.5">
              {new Date(reservation.completedAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      )}

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
          messages.map((msg) => {
            // 구 시스템 메세지 스킵 (confirm_request, buyer_confirmed)
            try {
              const parsed = JSON.parse(msg.content)
              if (parsed?.type === 'confirm_request' || parsed?.type === 'buyer_confirmed') return null
            } catch {}

            return (
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
            )
          })
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
            className="flex-1 px-4 py-2.5 bg-white border border-primary/25 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50 transition-all"
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

      {/* 상태 변경 확인 모달 */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-0 pb-0 sm:items-center sm:px-6"
          onClick={() => setPendingAction(null)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-foreground mb-1.5">{MODAL_CONFIG[pendingAction].title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {MODAL_CONFIG[pendingAction].description}
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setPendingAction(null)}
                className="flex-1 py-3 text-sm font-semibold rounded-xl border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={executeAction}
                className={cn(
                  'flex-1 py-3 text-sm font-bold rounded-xl transition-colors',
                  pendingAction === 'cancel'
                    ? 'bg-destructive text-white hover:bg-destructive/90'
                    : 'bg-primary text-white hover:bg-primary/90'
                )}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
