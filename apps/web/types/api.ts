// ==================== Auth Types ====================

export type SignupRequest = {
  email: string;
  password: string;
  nickname: string;
  location: string;
};

export type SignupResponse = {
  message: string;
  email: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: UserProfile;
};

export type MessageResponse = {
  message: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  newPassword: string;
};

export type ResendVerificationRequest = {
  email: string;
};

// ==================== User Types ====================

export type UserProfile = {
  id: string;
  email: string;
  nickname: string;
  location: string;
  avatarUrl?: string | null;
  mannerScore: number;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CheckEmailRequest = {
  email: string;
};

export type CheckEmailResponse = {
  available: boolean;
};

export type CheckNicknameRequest = {
  nickname: string;
};

export type CheckNicknameResponse = {
  available: boolean;
};
