import type { Metadata } from 'next'
import { MarketplaceContent } from '@/components/marketplace-content'

export const metadata: Metadata = {
  title: '중고거래 | 피치마켓',
  description: '조지아주 한인 커뮤니티 중고거래 매물을 검색하세요',
  openGraph: {
    title: '중고거래 | 피치마켓',
    description: '조지아주 한인 커뮤니티 중고거래 매물을 검색하세요',
    type: 'website',
  },
}

const Page = () => {
  return <MarketplaceContent />
}

export default Page
