import type { Product } from '@/lib/product-types'
import { apiRequest } from '@/lib/api'
import type {
  ProductResponseDto,
  ProductListResponseDto,
  CreateProductDto,
  UpdateProductDto,
  ProductQueryParams,
  ProductStatus,
} from '@/types/api'

// ── Product API ────────────────────────────

export const productApi = {
  getProducts: (params: ProductQueryParams = {}, cookies?: string) => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter((entry): entry is [string, string | number] => entry[1] != null && entry[1] !== '')
        .map(([k, v]) => [k, String(v)])
    )
    return apiRequest<ProductListResponseDto>(`/api/products?${query}`, undefined, cookies)
  },

  getProduct: (id: string, cookies?: string) =>
    apiRequest<ProductResponseDto>(`/api/products/${id}`, undefined, cookies),

  createProduct: (data: CreateProductDto) =>
    apiRequest<ProductResponseDto>('/api/products', {
      method: 'POST',
      body: data,
    }),

  updateProduct: (id: string, data: UpdateProductDto) =>
    apiRequest<ProductResponseDto>(`/api/products/${id}`, {
      method: 'PATCH',
      body: data,
    }),

  deleteProduct: (id: string) =>
    apiRequest<void>(`/api/products/${id}`, {
      method: 'DELETE',
    }),

  updateProductStatus: (id: string, status: ProductStatus) =>
    apiRequest<ProductResponseDto>(`/api/products/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  toggleFavorite: (productId: string) =>
    apiRequest<{ isFavorited: boolean }>(`/api/products/${productId}/favorite`, {
      method: 'POST',
    }),

  getFavorites: (cookies?: string) => apiRequest<ProductResponseDto[]>('/api/products/favorites', undefined, cookies),

  getMyProducts: (status?: ProductStatus, cookies?: string) => {
    const query = status ? `?status=${status}` : ''
    return apiRequest<ProductResponseDto[]>(`/api/products/my${query}`, undefined, cookies)
  },
}

// ── Legacy: ApiProduct → Product 변환 (marketplace/[id]/page.tsx 에서 사용) ──

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

export async function getProducts(params?: {
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
  const { data, error } = await apiRequest<ApiProduct[]>(`/api/products${qs ? `?${qs}` : ''}`)
  if (error || !data) throw new Error(error || '상품 목록을 불러올 수 없습니다.')
  return data
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'

export async function createProduct(
  body: {
    title: string
    description: string
    price: number
    category: string
    location: string
    lat?: number
    lng?: number
  },
  files?: File[]
): Promise<ApiProduct> {
  const formData = new FormData()
  formData.append('title', body.title)
  formData.append('description', body.description)
  formData.append('price', String(body.price))
  formData.append('category', body.category)
  formData.append('location', body.location)
  if (body.lat != null) formData.append('lat', String(body.lat))
  if (body.lng != null) formData.append('lng', String(body.lng))
  files?.forEach((file) => formData.append('files', file))

  const response = await fetch(`${API_URL}/api/products`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  let data: unknown
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message = (data as { message?: string })?.message
    throw new Error(message || '상품 등록에 실패했습니다.')
  }

  return data as ApiProduct
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
    lat: p.lat,
    lng: p.lng,
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

export async function getProduct(id: string): Promise<ApiProduct> {
  const { data, error } = await apiRequest<ApiProduct>(`/api/products/${id}`)
  if (error || !data) throw new Error(error || '상품을 찾을 수 없습니다.')
  return data
}
