/**
 * 🍑 피치마켓 공유 타입 정의
 * 
 * 프론트엔드(Next.js)와 백엔드(NestJS)에서 공통으로 사용하는 타입들입니다.
 * 여기에 정의한 타입은 API 응답, 요청 DTO 등에서 재사용됩니다.
 */

// ==================== 상품 관련 ====================

/**
 * 상품 거래 상태
 * - SELLING: 판매중 (🟢 녹색 배지)
 * - RESERVED: 예약중 (🟡 노란색 배지)
 * - SOLD: 판매완료 (⚫ 회색 배지)
 */
export type ProductStatus = 'SELLING' | 'RESERVED' | 'SOLD';

/**
 * 상품 목록/카드에 표시되는 기본 정보
 */
export interface ProductSummary {
  id: string;
  title: string;
  price: number;
  status: ProductStatus;
  thumbnailUrl: string;
  location: string;
  createdAt: string;
}

/**
 * 상품 상세 정보
 */
export interface ProductDetail extends ProductSummary {
  description: string;
  images: string[];
  seller: UserSummary;
}

// ==================== 사용자 관련 ====================

/**
 * 사용자 요약 정보 (프로필 카드, 판매자 정보 등)
 */
export interface UserSummary {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  mannerScore: number;
}

/**
 * 사용자 상세 프로필
 */
export interface UserProfile extends UserSummary {
  location: string;
  totalTransactions: number;
  responseRate: number;
  createdAt: string;
}

// ==================== 채팅 관련 ====================

/**
 * 채팅방 목록 아이템
 */
export interface ChatRoomSummary {
  id: string;
  product: {
    id: string;
    title: string;
    thumbnailUrl: string;
    price: number;
  };
  otherUser: UserSummary;
  lastMessage: string | null;
  updatedAt: string;
}

/**
 * 채팅 메시지
 */
export interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

// ==================== API 응답 형식 ====================

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

/**
 * API 에러 응답
 */
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}
