import { Header } from '@/components/layout/header'

const MarketPlaceLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <>
      <Header />
      {children}
    </>
  )
}

export default MarketPlaceLayout
