'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSocket } from '@/context/socket-provider'
import { chatApi, checkAuth } from '@/lib/api'
import { ChatMessageDto, ChatRoomWithMessagesDto } from '@/types/api'
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
      }
      setLoading(false)
    }
    loadRoom()
  }, [roomId, router])

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
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  const otherUser = chatRoom.buyerId === currentUserId ? chatRoom.seller : chatRoom.buyer

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-2 py-3 bg-background/80 backdrop-blur-md border-b">
        <button onClick={() => router.push('/chat')} className="p-1 rounded-lg hover:bg-accent">
          <IconChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {otherUser.avatarUrl ? (
              <img src={otherUser.avatarUrl} alt={otherUser.nickname} className="w-full h-full object-cover" />
            ) : (
              <span className="text-base font-semibold text-muted-foreground">{otherUser.nickname[0]}</span>
            )}
          </div>
          <div className="min-w-0">
            <span className="font-semibold truncate block">{otherUser.nickname}</span>
            {typingUser && <span className="text-xs text-primary">입력 중...</span>}
          </div>
        </div>

        <button className="p-2 rounded-lg hover:bg-accent">
          <IconDotsVertical className="w-5 h-5" />
        </button>
      </header>

      {/* Connection Status Banner */}
      {!isConnected && (
        <div className="bg-destructive/10 text-destructive text-center text-sm py-2 px-4">
          {isReconnecting ? '재연결 중...' : '연결이 끊어졌습니다'}
        </div>
      )}

      {/* Product Card */}
      <div className="flex items-center gap-3 p-3 border-b bg-muted/30">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {chatRoom.product.images[0] ? (
            <img src={chatRoom.product.images[0]} alt={chatRoom.product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              'inline-block px-1.5 py-0.5 text-[10px] font-medium rounded',
              chatRoom.product.status === 'SOLD'
                ? 'bg-muted text-muted-foreground'
                : chatRoom.product.status === 'RESERVED'
                  ? 'bg-warning text-warning-foreground'
                  : 'bg-success text-success-foreground'
            )}
          >
            {chatRoom.product.status === 'SOLD'
              ? '판매완료'
              : chatRoom.product.status === 'RESERVED'
                ? '예약중'
                : '판매중'}
          </span>
          <p className="text-sm font-medium truncate mt-0.5">{chatRoom.product.title}</p>
          <p className="text-sm font-bold text-primary">${(chatRoom.product.price / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            메시지가 없습니다. 대화를 시작해보세요!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex flex-col gap-1 max-w-[80%]',
                msg.senderId === currentUserId ? 'ml-auto items-end' : 'mr-auto items-start'
              )}
            >
              <div
                className={cn(
                  'px-4 py-2.5 text-[15px] leading-relaxed rounded-2xl',
                  msg.senderId === currentUserId
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-accent text-foreground rounded-bl-sm'
                )}
              >
                {msg.content}
              </div>
              <span className="text-xs text-muted-foreground px-1">
                {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t px-3 py-2 safe-area-pb">
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
            placeholder={isConnected ? '메시지를 입력하세요' : '연결 중...'}
            className="flex-1 px-4 py-2.5 bg-muted rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || !isConnected}
            className={cn(
              'p-2.5 rounded-full transition-colors',
              newMessage.trim() && isConnected
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <IconSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
