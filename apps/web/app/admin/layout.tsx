'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { IconShield, IconDashboard, IconFlag, IconUsers, IconPackage, IconLoader2 } from '@tabler/icons-react'
import { checkAuth } from '@/lib/api'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/admin', label: '대시보드', icon: IconDashboard, exact: true },
  { href: '/admin/reports', label: '신고 관리', icon: IconFlag },
  { href: '/admin/products', label: '상품 관리', icon: IconPackage },
  { href: '/admin/users', label: '사용자 관리', icon: IconUsers },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    checkAuth().then(({ isAuthenticated, user }) => {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        router.replace('/marketplace')
        return
      }
      setAuthorized(true)
    })
  }, [router])

  if (!authorized) {
    return (
      <div className="flex justify-center py-20">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
      <div className="flex items-center gap-2 mb-6">
        <IconShield className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">관리자</h1>
      </div>

      <nav className="flex gap-1 mb-6 border-b border-border">
        {TABS.map((tab) => {
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
