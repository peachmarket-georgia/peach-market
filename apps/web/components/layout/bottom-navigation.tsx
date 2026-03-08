'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconHome, IconSearch, IconMessage, IconUser } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

type BottomNavigationProps = {
  unreadCount?: number
}

const navItems = [
  { href: '/marketplace', icon: IconHome, label: '홈' },
  { href: '/marketplace?focus=search', icon: IconSearch, label: '검색' },
  { href: '/chat', icon: IconMessage, label: '채팅' },
  { href: '/mypage', icon: IconUser, label: '마이페이지' },
]

export function BottomNavigation({ unreadCount = 0 }: BottomNavigationProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/marketplace') {
      return pathname === '/marketplace' || pathname === '/'
    }
    const basePath = href.split('?')[0] ?? href
    return pathname.startsWith(basePath)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all active:scale-[0.98]',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className="w-6 h-6" strokeWidth={active ? 2 : 1.5} />
                {item.href === '/chat' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px]', active ? 'font-semibold' : 'font-medium')}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
