'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { MarketplaceNavigation } from '@/components/layout/marketplace-navigation'

const ChatLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  const pathname = usePathname()
  const isRoom = /^\/chat\/.+/.test(pathname)

  if (isRoom) {
    return (
      <div className="flex flex-col h-dvh">
        <Header />
        <div className="flex-1 min-h-0 pb-16 md:pb-0">{children}</div>
        <MarketplaceNavigation />
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="pb-20 md:pb-0">{children}</div>
      <MarketplaceNavigation />
    </>
  )
}

export default ChatLayout
