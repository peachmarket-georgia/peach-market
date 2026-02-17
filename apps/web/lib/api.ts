import {
  SignupDto,
  SignupResponseDto,
  LoginDto,
  LoginResponseDto,
  MessageResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ResendVerificationDto,
  UserProfileResponseDto,
  CheckAvailabilityResponseDto,
  ChatRoomDto,
  ChatRoomWithMessagesDto,
  UnreadCountDto,
  ProductResponseDto,
  ProductListResponseDto,
  CreateProductDto,
  UpdateProductDto,
  ProductQueryParams,
  ProductStatus,
} from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
};

/**
 * 통합 API 요청 함수
 * @param endpoint - API 엔드포인트
 * @param options - 요청 옵션
 * @param cookies - 서버 컴포넌트에서 쿠키 전달 (선택)
 */
async function apiRequest<T>(endpoint: string, options?: RequestOptions, cookies?: string): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
      ...(cookies ? { Cookie: cookies } : {}),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: options?.method || 'GET',
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      return {
        error: getErrorMessage(response.status, (data as { message?: string })?.message),
        status: response.status,
      };
    }

    return { data: data as T, status: response.status };
  } catch {
    return {
      error: '서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
      status: 0,
    };
  }
}

/**
 * 사용자 친화적 에러 메시지 변환
 */
function getErrorMessage(status: number, message?: string): string {
  const errorMap: Record<number, string> = {
    400: '입력하신 정보를 확인해주세요.',
    401: '이메일 또는 비밀번호가 올바르지 않습니다.',
    403: '접근 권한이 없습니다.',
    404: '요청하신 정보를 찾을 수 없습니다.',
    409: '이미 사용 중인 이메일 또는 닉네임입니다.',
    429: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
    500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  };

  // 특정 메시지 우선 처리
  if (message?.includes('이메일 인증')) {
    return '이메일 인증이 필요합니다. 인증 메일을 확인해주세요.';
  }

  if (message?.includes('인증되지 않은')) {
    return '이메일 인증이 필요합니다. 인증 메일을 확인해주세요.';
  }

  return errorMap[status] || message || '알 수 없는 오류가 발생했습니다.';
}

// ==================== Auth API ====================

export const authApi = {
  /**
   * 회원가입
   */
  signup: (data: SignupDto) =>
    apiRequest<SignupResponseDto>('/api/auth/signup', {
      method: 'POST',
      body: data,
    }),

  /**
   * 로그인
   */
  login: (data: LoginDto) =>
    apiRequest<LoginResponseDto>('/api/auth/login', {
      method: 'POST',
      body: data,
    }),

  /**
   * 로그아웃
   */
  logout: () =>
    apiRequest<MessageResponseDto>('/api/auth/logout', {
      method: 'POST',
    }),

  /**
   * 이메일 인증
   */
  verifyEmail: (token: string) => apiRequest<MessageResponseDto>(`/api/auth/verify-email/${token}`),

  /**
   * 이메일 재발송
   */
  resendVerification: (data: ResendVerificationDto) =>
    apiRequest<MessageResponseDto>('/api/auth/resend-verification', {
      method: 'POST',
      body: data,
    }),

  /**
   * 비밀번호 찾기
   */
  forgotPassword: (data: ForgotPasswordDto) =>
    apiRequest<MessageResponseDto>('/api/auth/forgot-password', {
      method: 'POST',
      body: data,
    }),

  /**
   * 비밀번호 재설정
   */
  resetPassword: (token: string, data: ResetPasswordDto) =>
    apiRequest<MessageResponseDto>(`/api/auth/reset-password/${token}`, {
      method: 'POST',
      body: data,
    }),

  /**
   * 토큰 갱신
   */
  refresh: () =>
    apiRequest<MessageResponseDto>('/api/auth/refresh', {
      method: 'POST',
    }),
};

// ==================== User API ====================

export const userApi = {
  /**
   * 내 프로필 조회
   * @param cookies - 서버 컴포넌트에서 쿠키 전달 (선택)
   */
  getMe: (cookies?: string) => apiRequest<UserProfileResponseDto>('/api/users/me', undefined, cookies),

  /**
   * 이메일 중복 체크
   */
  checkEmail: (email: string) =>
    apiRequest<CheckAvailabilityResponseDto>('/api/users/check-email', {
      method: 'POST',
      body: { email },
    }),

  /**
   * 닉네임 중복 체크
   */
  checkNickname: (nickname: string) =>
    apiRequest<CheckAvailabilityResponseDto>('/api/users/check-nickname', {
      method: 'POST',
      body: { nickname },
    }),
};

// ==================== Chat API ====================

export const chatApi = {
  /**
   * 내 채팅방 목록 조회
   * @param cookies - 서버 컴포넌트에서 쿠키 전달 (선택)
   */
  getRooms: (cookies?: string) => apiRequest<ChatRoomDto[]>('/api/chat/rooms', undefined, cookies),

  /**
   * 채팅방 상세 조회 (메시지 포함)
   * @param id - 채팅방 ID
   * @param cookies - 서버 컴포넌트에서 쿠키 전달 (선택)
   */
  getRoom: (id: string, cookies?: string) =>
    apiRequest<ChatRoomWithMessagesDto>(`/api/chat/rooms/${id}`, undefined, cookies),

  /**
   * 채팅방 생성 (상품 기반)
   * @param productId - 상품 ID
   */
  createRoom: (productId: string) =>
    apiRequest<ChatRoomDto>('/api/chat/rooms', {
      method: 'POST',
      body: { productId },
    }),

  /**
   * 메시지 읽음 처리
   * @param roomId - 채팅방 ID
   */
  markAsRead: (roomId: string) =>
    apiRequest<MessageResponseDto>(`/api/chat/rooms/${roomId}/read`, {
      method: 'PATCH',
    }),

  /**
   * 전체 안읽은 메시지 수
   * @param cookies - 서버 컴포넌트에서 쿠키 전달 (선택)
   */
  getUnreadCount: (cookies?: string) => apiRequest<UnreadCountDto>('/api/chat/unread-count', undefined, cookies),
};

// ==================== Product API ====================

export const productApi = {
  /**
   * 상품 목록 조회 (cursor pagination)
   * @param params - 쿼리 파라미터 (cursor, limit, search, category, status, sort)
   * @param cookies - 서버 컴포넌트에서 쿠키 전달 (선택)
   */
  getProducts: (params?: ProductQueryParams, cookies?: string) => {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.sort) query.set('sort', params.sort);

    const queryString = query.toString();
    return apiRequest<ProductListResponseDto>(
      `/api/products${queryString ? `?${queryString}` : ''}`,
      undefined,
      cookies
    );
  },

  /**
   * 상품 상세 조회
   * @param id - 상품 ID
   * @param cookies - 서버 컴포넌트에서 쿠키 전달 (선택)
   */
  getProduct: (id: string, cookies?: string) =>
    apiRequest<ProductResponseDto>(`/api/products/${id}`, undefined, cookies),

  /**
   * 상품 등록
   */
  createProduct: (data: CreateProductDto) =>
    apiRequest<ProductResponseDto>('/api/products', {
      method: 'POST',
      body: data,
    }),

  /**
   * 상품 수정
   */
  updateProduct: (id: string, data: UpdateProductDto) =>
    apiRequest<ProductResponseDto>(`/api/products/${id}`, {
      method: 'PATCH',
      body: data,
    }),

  /**
   * 상품 삭제
   */
  deleteProduct: (id: string) =>
    apiRequest<void>(`/api/products/${id}`, {
      method: 'DELETE',
    }),

  /**
   * 상품 상태 변경
   */
  updateProductStatus: (id: string, status: ProductStatus) =>
    apiRequest<ProductResponseDto>(`/api/products/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  /**
   * 찜 토글
   */
  toggleFavorite: (productId: string) =>
    apiRequest<{ isFavorited: boolean }>(`/api/products/${productId}/favorite`, {
      method: 'POST',
    }),
};

// ==================== Helper Functions ====================

/**
 * 인증 상태 확인
 */
export const checkAuth = async (cookies?: string) => {
  const { data, error } = await userApi.getMe(cookies);
  return { isAuthenticated: !error, user: data };
};
