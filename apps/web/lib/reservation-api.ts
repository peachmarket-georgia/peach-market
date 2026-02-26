import { apiRequest } from '@/lib/api'
import type { ReservationDto } from '@/types/reservation'

export const reservationApi = {
  /** 예약 생성 (판매자 전용) — Product 상태도 RESERVED로 자동 변경 */
  create: (productId: string, buyerId: string) =>
    apiRequest<ReservationDto>('/api/reservations', {
      method: 'POST',
      body: { productId, buyerId },
    }),

  /** 상품 ID로 현재 활성 예약 조회 (채팅방에서 사용) */
  getByProduct: (productId: string) => apiRequest<ReservationDto | null>(`/api/reservations/by-product/${productId}`),

  /** 거래 완료 확인 (구매자/판매자 각자 호출) */
  confirm: (id: string) =>
    apiRequest<ReservationDto>(`/api/reservations/${id}/confirm`, {
      method: 'PATCH',
    }),

  /** 예약 취소 (판매자 전용) — Product 상태도 SELLING으로 자동 복원 */
  cancel: (id: string) =>
    apiRequest<ReservationDto>(`/api/reservations/${id}/cancel`, {
      method: 'PATCH',
    }),

  /** 내 예약 목록 */
  getMy: (role?: 'buyer' | 'seller') => {
    const query = role ? `?role=${role}` : ''
    return apiRequest<ReservationDto[]>(`/api/reservations/my${query}`)
  },
}
