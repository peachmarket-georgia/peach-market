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
  UpdateUserDto,
  ChatRoomDto,
  ChatRoomWithMessagesDto,
  UnreadCountDto,
  UploadResponseDto,
  CreateReportDto,
  ReportResponseDto,
  AdminReportDto,
  AdminUserDto,
  AdminUserDetailDto,
  AdminProductDto,
  AdminStatsDto,
  UserBlockDto,
} from '@/types/api'

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'

// 동시 refresh 방지 mutex
let refreshingPromise: Promise<boolean> | null = null

export async function tryRefresh(apiUrl: string): Promise<boolean> {
  if (refreshingPromise) return refreshingPromise

  refreshingPromise = fetch(`${apiUrl}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((res) => res.ok)
    .finally(() => {
      refreshingPromise = null
    })

  return refreshingPromise
}

export type ApiResponse<T> = {
  data?: T
  error?: string
  status: number
}

export type RequestOptions = {
  method?: string
  body?: unknown
  headers?: HeadersInit
  skipRedirect?: boolean
}

/**
 * 통합 API 요청 함수
 * @param endpoint - API 엔드포인트
 * @param options - 요청 옵션
 * @param cookies - 서버 컴포넌트에서 쿠키 전달 (선택)
 * @param _isRetry - 내부용: 토큰 갱신 후 재시도 여부 (무한 루프 방지)
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestOptions,
  cookies?: string,
  _isRetry = false
): Promise<ApiResponse<T>> {
  try {
    const apiUrl = getApiUrl()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
      ...(cookies ? { Cookie: cookies } : {}),
    }

    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: options?.method || 'GET',
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
    })

    let data: unknown
    try {
      data = await response.json()
    } catch {
      data = null
    }

    // 401 → 차단된 계정이면 정지 페이지로, 아니면 refresh 시도
    // /api/users/me 는 비로그인 확인용이므로 redirect 제외
    if (response.status === 401) {
      const msg = (data as { message?: string })?.message
      if (msg?.includes('차단된 계정') && typeof window !== 'undefined') {
        window.location.href = '/blocked'
        return { error: '계정이 정지되었습니다.', status: 401 }
      }

      if (!_isRetry && !endpoint.startsWith('/api/auth/') && endpoint !== '/api/users/me') {
        let refreshed = false
        try {
          refreshed = await tryRefresh(apiUrl)
        } catch {
          // network error during refresh → treat as refresh failure
        }

        if (refreshed) {
          const retryResult = await apiRequest<T>(endpoint, options, cookies, true)
          if (retryResult.status === 401 && typeof window !== 'undefined' && !options?.skipRedirect) {
            window.location.href = '/login'
          }
          return retryResult
        }

        // refresh 실패 → 로그인 페이지로 이동 (skipRedirect가 아닌 경우)
        if (typeof window !== 'undefined' && !options?.skipRedirect) {
          window.location.href = '/login'
        }
        return { error: '세션이 만료되었습니다. 다시 로그인해주세요.', status: 401 }
      }
    }

    if (!response.ok) {
      return {
        error: getErrorMessage(response.status, (data as { message?: string })?.message),
        status: response.status,
      }
    }

    return { data: data as T, status: response.status }
  } catch {
    return {
      error: '서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
      status: 0,
    }
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
  }

  // 특정 메시지 우선 처리
  if (message?.includes('이메일 인증')) {
    return '이메일 인증이 필요합니다. 인증 메일을 확인해주세요.'
  }

  if (message?.includes('인증되지 않은')) {
    return '이메일 인증이 필요합니다. 인증 메일을 확인해주세요.'
  }

  return errorMap[status] || message || '알 수 없는 오류가 발생했습니다.'
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
}

// ==================== User API ====================

export const userApi = {
  /**
   * 내 프로필 조회
   * @param cookies - 서버 컴포넌트에서 쿠키 전달 (선택)
   */
  getMe: (cookies?: string, options?: { skipRedirect?: boolean }) =>
    apiRequest<UserProfileResponseDto>(
      '/api/users/me',
      options ? { skipRedirect: options.skipRedirect } : undefined,
      cookies
    ),

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

  /**
   * 프로필 수정
   */
  updateProfile: (data: UpdateUserDto) =>
    apiRequest<UserProfileResponseDto>('/api/users/me', {
      method: 'PATCH',
      body: data,
    }),

  blockUser: (userId: string) => apiRequest<MessageResponseDto>(`/api/users/${userId}/block`, { method: 'POST' }),

  unblockUser: (userId: string) => apiRequest<MessageResponseDto>(`/api/users/${userId}/block`, { method: 'DELETE' }),

  getBlockedUsers: () => apiRequest<UserBlockDto[]>('/api/users/blocked'),
}

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

  /**
   * 채팅방 나가기
   * @param roomId - 채팅방 ID
   */
  leaveRoom: (roomId: string) =>
    apiRequest<MessageResponseDto>(`/api/chat/rooms/${roomId}`, {
      method: 'DELETE',
    }),
}

// ==================== Upload API ====================

export const uploadApi = {
  /**
   * 이미지 업로드
   * @param files - 업로드할 파일들 (최대 5개)
   */
  uploadImages: async (
    files: File[],
    _isRetry = false
  ): Promise<{ data?: UploadResponseDto; error?: string; status: number }> => {
    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))

      const apiUrl = getApiUrl()

      const response = await fetch(`${apiUrl}/api/upload/images`, {
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

      // 401 → 차단 체크 후 refresh 재시도
      if (response.status === 401) {
        const msg = (data as { message?: string })?.message
        if (msg?.includes('차단된 계정') && typeof window !== 'undefined') {
          window.location.href = '/blocked'
          return { error: '계정이 정지되었습니다.', status: 401 }
        }

        if (!_isRetry) {
          let refreshed = false
          try {
            refreshed = await tryRefresh(apiUrl)
          } catch {
            // network error during refresh
          }
          if (refreshed) {
            return uploadApi.uploadImages(files, true)
          }
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          return { error: '세션이 만료되었습니다. 다시 로그인해주세요.', status: 401 }
        }
      }

      if (!response.ok) {
        return {
          error: (data as { message?: string })?.message || '이미지 업로드에 실패했습니다.',
          status: response.status,
        }
      }

      return { data: data as UploadResponseDto, status: response.status }
    } catch {
      return {
        error: '서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
        status: 0,
      }
    }
  },
}

// ==================== Report API ====================

export const reportApi = {
  create: (data: CreateReportDto) =>
    apiRequest<ReportResponseDto>('/api/reports', {
      method: 'POST',
      body: data,
    }),

  getMyReports: () => apiRequest<ReportResponseDto[]>('/api/reports/my'),
}

// ==================== Admin API ====================

export const adminApi = {
  getStats: () => apiRequest<AdminStatsDto>('/api/admin/stats'),

  getReports: (params?: { type?: string; status?: string }) => {
    const query = new URLSearchParams()
    if (params?.type) query.set('type', params.type)
    if (params?.status) query.set('status', params.status)
    const qs = query.toString()
    return apiRequest<AdminReportDto[]>(`/api/admin/reports${qs ? `?${qs}` : ''}`)
  },

  getReport: (id: string) => apiRequest<AdminReportDto>(`/api/admin/reports/${id}`),

  getUser: (id: string) => apiRequest<AdminUserDetailDto>(`/api/admin/users/${id}`),

  updateReport: (id: string, data: { status?: string; adminNote?: string }) =>
    apiRequest<AdminReportDto>(`/api/admin/reports/${id}`, { method: 'PATCH', body: data }),

  getUsers: (params?: { search?: string; blocked?: string }) => {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.blocked) query.set('blocked', params.blocked)
    const qs = query.toString()
    return apiRequest<AdminUserDto[]>(`/api/admin/users${qs ? `?${qs}` : ''}`)
  },

  blockUser: (userId: string) =>
    apiRequest<MessageResponseDto>(`/api/admin/users/${userId}/block`, { method: 'PATCH' }),

  unblockUser: (userId: string) =>
    apiRequest<MessageResponseDto>(`/api/admin/users/${userId}/unblock`, { method: 'PATCH' }),

  promoteUser: (userId: string) =>
    apiRequest<MessageResponseDto>(`/api/admin/users/${userId}/promote`, { method: 'PATCH' }),

  demoteUser: (userId: string) =>
    apiRequest<MessageResponseDto>(`/api/admin/users/${userId}/demote`, { method: 'PATCH' }),

  getProducts: (params?: { search?: string; status?: string; category?: string }) => {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.status) query.set('status', params.status)
    if (params?.category) query.set('category', params.category)
    const qs = query.toString()
    return apiRequest<AdminProductDto[]>(`/api/admin/products${qs ? `?${qs}` : ''}`)
  },

  updateProductStatus: (productId: string, status: string) =>
    apiRequest<MessageResponseDto>(`/api/admin/products/${productId}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  deleteProduct: (productId: string) =>
    apiRequest<MessageResponseDto>(`/api/admin/products/${productId}`, { method: 'DELETE' }),
}

// ==================== Helper Functions ====================

/**
 * 인증 상태 확인
 */
export const checkAuth = async (cookies?: string) => {
  const { data, error } = await userApi.getMe(cookies)
  return { isAuthenticated: !error, user: data }
}
