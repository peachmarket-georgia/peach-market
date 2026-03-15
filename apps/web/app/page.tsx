import { Header } from '@/components/layout/header'
import { MarketplaceNavigation } from '@/components/layout/marketplace-navigation'
import { MarketplaceContent } from '@/components/marketplace-content'

const HomePage = () => {
  return (
    <>
      <Header />
      <div className="mt-4 md:mt-0 pb-20 md:pb-0">
        <MarketplaceContent />
      </div>
      <MarketplaceNavigation />
    </>
  )
}

export default HomePage
