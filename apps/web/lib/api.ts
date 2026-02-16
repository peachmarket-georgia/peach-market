import {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResendVerificationRequest,
  UserProfile,
  CheckEmailResponse,
  CheckNicknameResponse,
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
  signup: (data: SignupRequest) =>
    apiRequest<SignupResponse>('/api/auth/signup', {
      method: 'POST',
      body: data,
    }),

  /**
   * 로그인
   */
  login: (data: LoginRequest) =>
    apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: data,
    }),

  /**
   * 로그아웃
   */
  logout: () =>
    apiRequest<MessageResponse>('/api/auth/logout', {
      method: 'POST',
    }),

  /**
   * 이메일 인증
   */
  verifyEmail: (token: string) => apiRequest<MessageResponse>(`/api/auth/verify-email/${token}`),

  /**
   * 이메일 재발송
   */
  resendVerification: (data: ResendVerificationRequest) =>
    apiRequest<MessageResponse>('/api/auth/resend-verification', {
      method: 'POST',
      body: data,
    }),

  /**
   * 비밀번호 찾기
   */
  forgotPassword: (data: ForgotPasswordRequest) =>
    apiRequest<MessageResponse>('/api/auth/forgot-password', {
      method: 'POST',
      body: data,
    }),

  /**
   * 비밀번호 재설정
   */
  resetPassword: (token: string, data: ResetPasswordRequest) =>
    apiRequest<MessageResponse>(`/api/auth/reset-password/${token}`, {
      method: 'POST',
      body: data,
    }),

  /**
   * 토큰 갱신
   */
  refresh: () =>
    apiRequest<MessageResponse>('/api/auth/refresh', {
      method: 'POST',
    }),
};

// ==================== User API ====================

export const userApi = {
  /**
   * 내 프로필 조회
   * @param cookies - 서버 컴포넌트에서 쿠키 전달 (선택)
   */
  getMe: (cookies?: string) => apiRequest<UserProfile>('/api/users/me', undefined, cookies),

  /**
   * 이메일 중복 체크
   */
  checkEmail: (email: string) =>
    apiRequest<CheckEmailResponse>('/api/users/check-email', {
      method: 'POST',
      body: { email },
    }),

  /**
   * 닉네임 중복 체크
   */
  checkNickname: (nickname: string) =>
    apiRequest<CheckNicknameResponse>('/api/users/check-nickname', {
      method: 'POST',
      body: { nickname },
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
