'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSocket } from '@/context/socket-provider';
import { cn } from '@/lib/utils';
import { ChevronLeft, MoreVertical, Send, Plus, Image } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

// 테스트용 유저 프리셋
const TEST_USERS: Record<string, { nickname: string; emoji: string }> = {
  'user-peach': { nickname: '피치', emoji: '🍑' },
  'user-mango': { nickname: '망고', emoji: '🥭' },
  'user-apple': { nickname: '사과', emoji: '🍎' },
  'user-grape': { nickname: '포도', emoji: '🍇' },
};

// 테스트용 더미 데이터
const MOCK_PRODUCT = {
  id: 'product-1',
  title: '아이폰 15 Pro 256GB 블랙',
  price: 950000,
  image: 'https://picsum.photos/seed/iphone/200',
  status: 'SELLING' as const,
};

function getUserInfo(userId: string) {
  const preset = TEST_USERS[userId];
  if (preset) {
    return preset;
  }
  return { nickname: userId, emoji: '👤' };
}

// ============ ChatHeader ============
function ChatHeader({
  currentUser,
  onBack,
}: {
  currentUser: { nickname: string; emoji: string };
  onBack?: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 px-2 py-3 bg-background/80 backdrop-blur-md border-b">
      <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
        <ChevronLeft className="w-6 h-6" />
      </Button>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="w-10 h-10 bg-accent">
          <AvatarFallback className="text-lg">{currentUser.emoji}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <span className="font-semibold truncate block">{currentUser.nickname}</span>
          <span className="text-xs text-muted-foreground">테스트 채팅방</span>
        </div>
      </div>

      <Button variant="ghost" size="icon" className="shrink-0">
        <MoreVertical className="w-5 h-5" />
      </Button>
    </header>
  );
}

// ============ ProductCard ============
function ProductCard({ product }: { product: typeof MOCK_PRODUCT }) {
  const statusConfig = {
    SELLING: { label: '판매중', className: 'bg-green-500 text-white' },
    RESERVED: { label: '예약중', className: 'bg-yellow-500 text-white' },
    SOLD: { label: '판매완료', className: 'bg-muted text-muted-foreground' },
  };

  const status = statusConfig[product.status];

  return (
    <div className="flex items-center gap-3 p-3 border-b bg-muted/30">
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs px-1.5 py-0.5', status.className)}>{status.label}</Badge>
        </div>
        <p className="text-sm font-medium truncate mt-0.5">{product.title}</p>
        <p className="text-sm font-bold text-foreground">{product.price.toLocaleString()}원</p>
      </div>
    </div>
  );
}

// ============ MessageBubble ============
function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const time = new Date(message.createdAt).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const senderInfo = getUserInfo(message.senderId);

  return (
    <div className={cn('flex flex-col gap-1 max-w-[80%]', isOwn ? 'ml-auto items-end' : 'mr-auto items-start')}>
      {!isOwn && (
        <span className="text-xs text-muted-foreground px-1 flex items-center gap-1">
          <span>{senderInfo.emoji}</span>
          <span>{senderInfo.nickname}</span>
        </span>
      )}
      <div
        className={cn(
          'px-4 py-2.5 text-[15px] leading-relaxed',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
            : 'bg-accent text-foreground rounded-2xl rounded-bl-sm'
        )}
      >
        {message.content}
      </div>
      <span className="text-xs text-muted-foreground px-1">{time}</span>
    </div>
  );
}

// ============ ChatInput ============
function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="sticky bottom-0 bg-background border-t px-3 py-2 safe-area-bottom">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
          <Plus className="w-6 h-6" />
        </Button>
        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
          <Image className="w-5 h-5" />
        </Button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요"
            disabled={disabled}
            className="w-full px-4 py-2.5 bg-muted rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
        </div>

        <Button
          size="icon"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="shrink-0 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

// ============ Main Page ============
export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const roomId = params.roomId as string;
  const userId = searchParams.get('userId') || '';

  const { socket, isConnected } = useSocket();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // userId가 없으면 설정 페이지로 리다이렉트
  useEffect(() => {
    if (!userId) {
      router.replace('/chat-test');
    }
  }, [userId, router]);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 방 자동 참가
  useEffect(() => {
    if (!socket || !isConnected || !roomId || !userId || isJoined) return;

    socket.emit('joinRoom', { roomId, userId });
  }, [socket, isConnected, roomId, userId, isJoined]);

  // 소켓 이벤트 리스너
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleJoinedRoom = () => {
      setIsJoined(true);
    };

    const handleLeftRoom = () => {
      setIsJoined(false);
      setMessages([]);
    };

    // 기존 리스너 제거 후 등록 (Strict Mode 대응)
    socket.off('newMessage', handleNewMessage);
    socket.off('joinedRoom', handleJoinedRoom);
    socket.off('leftRoom', handleLeftRoom);

    socket.on('newMessage', handleNewMessage);
    socket.on('joinedRoom', handleJoinedRoom);
    socket.on('leftRoom', handleLeftRoom);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('joinedRoom', handleJoinedRoom);
      socket.off('leftRoom', handleLeftRoom);
    };
  }, [socket]);

  const handleBack = () => {
    if (socket && roomId) {
      socket.emit('leaveRoom', roomId);
    }
    router.push('/chat-test');
  };

  const handleSendMessage = () => {
    if (!socket || !roomId || !userId || !message.trim()) return;

    socket.emit('sendTestMessage', {
      roomId,
      senderId: userId,
      content: message.trim(),
    });
    setMessage('');
  };

  if (!userId) {
    return null;
  }

  const currentUserInfo = getUserInfo(userId);

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <ChatHeader currentUser={currentUserInfo} onBack={handleBack} />

      {/* Product Card */}
      <ProductCard product={MOCK_PRODUCT} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.length === 0 && isJoined && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-3">
              <span className="text-3xl">🍑</span>
            </div>
            <p className="text-muted-foreground text-sm">대화를 시작해보세요!</p>
          </div>
        )}

        {!isJoined && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground text-sm">{isConnected ? '채팅방에 참여 중...' : '서버에 연결 중...'}</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === userId} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput value={message} onChange={setMessage} onSend={handleSendMessage} disabled={!isJoined} />
    </div>
  );
}
