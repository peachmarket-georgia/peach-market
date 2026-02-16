'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/context/socket-provider'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Check, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

// 테스트용 유저 프리셋
const TEST_USERS = [
  { id: 'user-peach', nickname: '피치', emoji: '🍑' },
  { id: 'user-mango', nickname: '망고', emoji: '🥭' },
  { id: 'user-apple', nickname: '사과', emoji: '🍎' },
  { id: 'user-grape', nickname: '포도', emoji: '🍇' },
]

// 테스트용 채팅방 (고정)
const TEST_ROOM_ID = 'test-chat-room'

export default function ChatTestSetupPage() {
  const router = useRouter()
  const { isConnected } = useSocket()
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [customNickname, setCustomNickname] = useState('')

  const handleStartChat = () => {
    const userId = selectedUser || customNickname.trim()
    if (!userId) return

    const params = new URLSearchParams({ userId })
    router.push(`/chat-test/${TEST_ROOM_ID}?${params.toString()}`)
  }

  const isValid = selectedUser || customNickname.trim()

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">채팅 테스트</h1>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6">
        <div className="w-full max-w-sm mx-auto space-y-8">
          {/* Connection Status */}
          <div
            className={cn(
              'flex items-center justify-center gap-2 p-3 rounded-xl',
              isConnected
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            )}
          >
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">서버 연결됨</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">서버 연결 안됨</span>
              </>
            )}
          </div>

          {/* User Selection */}
          <div>
            <h2 className="text-base font-semibold mb-3">테스트 유저 선택</h2>
            <div className="grid grid-cols-2 gap-3">
              {TEST_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user.id)
                    setCustomNickname('')
                  }}
                  className={cn(
                    'relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                    selectedUser === user.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Avatar className="w-10 h-10 bg-accent">
                    <AvatarFallback className="text-lg">
                      {user.emoji}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.nickname}</span>
                  {selectedUser === user.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">또는</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Custom Nickname */}
          <div>
            <h2 className="text-base font-semibold mb-3">직접 입력</h2>
            <input
              type="text"
              value={customNickname}
              onChange={(e) => {
                setCustomNickname(e.target.value)
                setSelectedUser(null)
              }}
              placeholder="닉네임을 입력하세요"
              className="w-full px-4 py-3 bg-muted rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Info */}
          <div className="p-4 bg-accent/50 rounded-xl">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">테스트 방법:</span>
              <br />
              브라우저 2개를 열고 서로 다른 유저로 접속하면 실시간 채팅을
              테스트할 수 있습니다.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleStartChat}
            disabled={!isConnected || !isValid}
            className="w-full py-6 text-base rounded-xl"
          >
            채팅 시작하기
          </Button>
        </div>
      </div>
    </div>
  )
}
