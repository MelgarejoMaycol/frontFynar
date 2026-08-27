export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string | null
  phone: string | null
  avatarUrl: string | null
  isEmailVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}
export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  acceptedTerms?: boolean
}
export interface RegisterResult {
  user: AuthUser
  verificationRequired?: true
  tokens?: AuthTokens
}
export interface ResendVerificationRequest {
  email: string
}
export interface VerifyEmailRequest {
  token: string
}
export interface ForgotPasswordRequest {
  email: string
}
export interface ResetPasswordRequest {
  token: string
  newPassword: string
}
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
export interface AuthTokens {
  accessToken: string
  accessTokenExpiresInSeconds: number
}
export interface AuthResult {
  user: AuthUser
  tokens: AuthTokens
}
export interface ForgotPasswordResult {
  message: string
}
