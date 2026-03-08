import { Header } from '@/components/layout/header'
import { MarketplaceNavigation } from '@/components/layout/marketplace-navigation'

const ChatLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <>
      <Header />
      <div className="pb-20 md:pb-0">{children}</div>
      <MarketplaceNavigation />
    </>
  )
}

export default ChatLayout
