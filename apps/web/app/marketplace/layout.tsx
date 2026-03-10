import { Header } from '@/components/layout/header'
import { MarketplaceNavigation } from '@/components/layout/marketplace-navigation'

const MarketPlaceLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <>
      <Header />
      <div className="mt-4 md:mt-0 pb-20 md:pb-0">{children}</div>
      <MarketplaceNavigation />
    </>
  )
}

export default MarketPlaceLayout
