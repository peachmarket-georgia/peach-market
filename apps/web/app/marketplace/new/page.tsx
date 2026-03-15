import type { Metadata } from 'next'
import ProductCreatePage from './product-create-page'

export const metadata: Metadata = {
  title: '매물 등록 | 피치마켓',
  description: '피치마켓에서 중고 매물을 등록하세요',
  openGraph: {
    title: '매물 등록 | 피치마켓',
    description: '피치마켓에서 중고 매물을 등록하세요',
    type: 'website',
  },
}

const Page = () => {
  return <ProductCreatePage />
}

export default Page
