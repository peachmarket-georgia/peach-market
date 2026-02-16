/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface SignupDto {
  /**
   * 이메일 주소
   * @example "user@example.com"
   */
  email: string;
  /**
   * 비밀번호 (최소 8자)
   * @minLength 8
   * @example "password123!"
   */
  password: string;
  /**
   * 닉네임 (2-20자)
   * @minLength 2
   * @maxLength 20
   * @example "피치유저"
   */
  nickname: string;
  /**
   * 거주 지역 (미국 조지아주 내)
   * @example "Atlanta, GA"
   */
  location: string;
}

export interface SignupResponseDto {
  /** @example "회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요." */
  message: string;
  /** @example "user@example.com" */
  email: string;
}

export interface MessageResponseDto {
  /** @example "성공 메시지" */
  message: string;
}

export interface ResendVerificationDto {
  /**
   * 인증 이메일을 재발송할 이메일 주소
   * @example "user@example.com"
   */
  email: string;
}

export interface LoginDto {
  /**
   * 이메일 주소
   * @example "user@example.com"
   */
  email: string;
  /**
   * 비밀번호
   * @example "password123!"
   */
  password: string;
}

export interface LoginResponseDto {
  /**
   * 로그인한 사용자 정보 (비밀번호 제외)
   * @example {"id":"user-id","email":"user@example.com","nickname":"피치유저","location":"Georgia","isEmailVerified":true,"createdAt":"2024-01-01T00:00:00.000Z","updatedAt":"2024-01-01T00:00:00.000Z"}
   */
  user: object;
}

export type ForgotPasswordDto = object;

export type ResetPasswordDto = object;

export interface CheckAvailabilityResponseDto {
  /**
   * true: 사용 가능, false: 이미 사용 중
   * @example true
   */
  available: boolean;
}

export interface UserProfileResponseDto {
  /** @example "user-id" */
  id: string;
  /** @example "user@example.com" */
  email: string;
  /** @example "피치유저" */
  nickname: string;
  /** @example "Georgia" */
  location: string;
  /** @example true */
  isEmailVerified: boolean;
  /**
   * @format date-time
   * @example "2024-01-01T00:00:00.000Z"
   */
  createdAt: string;
  /**
   * @format date-time
   * @example "2024-01-01T00:00:00.000Z"
   */
  updatedAt: string;
}
