import type { Metadata } from 'next'
import EditProductPage from './edit-product-page'

export const metadata: Metadata = {
  title: '매물 수정 | 피치마켓',
  description: '등록한 매물 정보를 수정합니다',
  openGraph: {
    title: '매물 수정 | 피치마켓',
    description: '등록한 매물 정보를 수정합니다',
    type: 'website',
  },
}

const Page = () => {
  return <EditProductPage />
}

export default Page
