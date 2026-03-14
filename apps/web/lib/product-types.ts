// ===========================================
// 피치마켓 프론트엔드 타입 & 상수
// ===========================================

// ── 상품 상태 ──────────────────────────────
export type ProductStatus = 'SELLING' | 'RESERVED' | 'CONFIRMED' | 'ENDED'

export const STATUS_LABEL: Record<ProductStatus, string> = {
  SELLING: '판매 중',
  RESERVED: '예약 중',
  CONFIRMED: '판매 확정',
  ENDED: '판매 종료',
}

// ── 카테고리 (PRD 4.2 기준) ────────────────
export const CATEGORIES = ['전자기기', '가구', '의류', '생활용품', '식품', '유아/아동', '자동차', '기타'] as const

export type Category = (typeof CATEGORIES)[number]

// ── 정렬 ───────────────────────────────────
export type SortOption = 'latest' | 'price_asc' | 'price_desc'

export const SORT_LABELS: Record<SortOption, string> = {
  latest: '최신순',
  price_asc: '낮은 가격순',
  price_desc: '높은 가격순',
}

// ── 상품 ───────────────────────────────────
export type Product = {
  id: string
  title: string
  description: string
  price: number
  category: string
  status: ProductStatus
  isHidden?: boolean
  thumbnailUrl: string
  images: string[]
  location: string
  timeAgo: string
  viewCount: number
  chatCount: number
  likeCount: number
  seller: {
    id: string
    nickname: string
    avatarUrl: string | null
    mannerScore: number
  }
}
