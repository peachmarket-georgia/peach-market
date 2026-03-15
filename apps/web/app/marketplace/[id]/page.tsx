import type { Metadata } from 'next'
import ProductDetailPage from './product-detail-page'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      return { title: '매물 상세 | 피치마켓' }
    }

    const product = await res.json()
    const price = Number(product.price)
    const priceText = price === 0 ? '무료 나눔' : `$${price.toLocaleString()}`
    const title = `${priceText} | ${product.title}`
    const description = `📍 ${product.location} · 조지아 한인 중고거래 피치마켓에서 ${product.category} 매물을 확인하세요!`
    const thumbnail = product.images?.[0]

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        ...(thumbnail ? { images: [{ url: thumbnail, width: 800, height: 600, alt: product.title }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(thumbnail ? { images: [thumbnail] } : {}),
      },
    }
  } catch {
    return { title: '매물 상세 | 피치마켓' }
  }
}

const Page = (props: Props) => {
  return <ProductDetailPage {...props} />
}

export default Page
