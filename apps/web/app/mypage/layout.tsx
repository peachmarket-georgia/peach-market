import { MarketplaceNavigation } from '@/components/layout/marketplace-navigation'

const MyPageLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <>
      <div className="pb-20 md:pb-0">{children}</div>
      <MarketplaceNavigation />
    </>
  )
}

export default MyPageLayout
