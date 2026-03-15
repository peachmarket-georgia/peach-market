'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconPlus } from '@tabler/icons-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type FABProps = {
  href?: string
  onClick?: () => void
  className?: string
  isAuthenticated?: boolean
}

export function FAB({ href = '/marketplace/new', onClick, className, isAuthenticated = true }: FABProps) {
  const router = useRouter()

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.info('로그인이 필요합니다', {
        description: '상품을 등록하려면 먼저 로그인해주세요',
        action: {
          label: '로그인',
          onClick: () => router.push('/login?redirect=/marketplace/new'),
        },
      })
      return
    }
    if (onClick) {
      onClick()
    } else {
      router.push(href)
    }
  }

  const buttonContent = (
    <div
      className={cn(
        'fixed bottom-24 right-4 h-12 px-5 bg-primary text-primary-foreground rounded-full shadow-lg',
        'flex items-center gap-2',
        'transition-all hover:scale-105 active:scale-[0.98]',
        'md:hidden z-40',
        className
      )}
    >
      <IconPlus className="w-5 h-5" strokeWidth={2.5} />
      <span className="text-sm font-semibold">판매하기</span>
    </div>
  )

  // 비로그인 또는 커스텀 onClick이 있는 경우 버튼으로 처리
  if (!isAuthenticated || onClick) {
    return (
      <button type="button" onClick={handleClick} aria-label="상품 등록">
        {buttonContent}
      </button>
    )
  }

  return (
    <Link href={href} aria-label="상품 등록">
      {buttonContent}
    </Link>
  )
}
