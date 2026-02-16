import type { Product, ProductStatus } from '@/lib/product-types'
import { apiFetch } from '@/lib/api'

// ── Products API ───────────────────────────

export type ApiProduct = {
  id: string
  title: string
  description: string
  price: number
  category: string
  status: ProductStatus
  images: string[]
  location: string
  viewCount: number
  createdAt: string
  updatedAt: string
  seller: {
    id: string
    nickname: string
    avatarUrl: string | null
    mannerScore: number
  }
}

export function getProducts(params?: {
  search?: string
  category?: string
  status?: string
  sort?: string
}): Promise<ApiProduct[]> {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.category) query.set('category', params.category)
  if (params?.status) query.set('status', params.status)
  if (params?.sort) query.set('sort', params.sort)

  const qs = query.toString()
  return apiFetch(`/products${qs ? `?${qs}` : ''}`)
}

export function getProduct(id: string): Promise<ApiProduct> {
  return apiFetch(`/products/${id}`)
}

export function createProduct(data: {
  title: string
  description: string
  price: number
  category: string
  location: string
}): Promise<ApiProduct> {
  return apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ── ApiProduct → Product 변환 ──────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

export function toProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    status: p.status,
    category: p.category,
    thumbnailUrl: p.images[0] || '',
    images: p.images,
    location: p.location,
    timeAgo: timeAgo(p.createdAt),
    seller: {
      id: p.seller.id,
      nickname: p.seller.nickname,
      avatarUrl: p.seller.avatarUrl,
      mannerScore: p.seller.mannerScore,
    },
    viewCount: p.viewCount,
    chatCount: 0,
    likeCount: 0,
  }
}
