import { httpClient } from '@/services/http/httpClient'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  AuthResult,
  AuthTokens,
  AuthUser,
  ForgotPasswordRequest,
  ForgotPasswordResult,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '../types/auth.types'
import { AUTH_ROUTES } from '../auth.routes'

export const authApi = {
  register: (body: RegisterRequest, signal?: AbortSignal) =>
    httpClient.post<ApiSuccess<AuthResult>, RegisterRequest>(
      AUTH_ROUTES.register,
      body,
      signal,
    ),
  login: (body: LoginRequest, signal?: AbortSignal) =>
    httpClient.post<ApiSuccess<AuthResult>, LoginRequest>(
      AUTH_ROUTES.login,
      body,
      signal,
    ),
  refresh: (signal?: AbortSignal) =>
    httpClient.post<ApiSuccess<AuthTokens>, undefined>(
      AUTH_ROUTES.refresh,
      undefined,
      signal,
    ),
  logout: (signal?: AbortSignal) =>
    httpClient.post<void, undefined>(AUTH_ROUTES.logout, undefined, signal),
  logoutAll: (signal?: AbortSignal) =>
    httpClient.post<void, undefined>(AUTH_ROUTES.logoutAll, undefined, signal),
  getCurrentUser: (signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<AuthUser>>(AUTH_ROUTES.me, signal),
  forgotPassword: (body: ForgotPasswordRequest, signal?: AbortSignal) =>
    httpClient.post<ApiSuccess<ForgotPasswordResult>, ForgotPasswordRequest>(
      AUTH_ROUTES.forgotPassword,
      body,
      signal,
    ),
  resetPassword: (body: ResetPasswordRequest, signal?: AbortSignal) =>
    httpClient.post<void, ResetPasswordRequest>(
      AUTH_ROUTES.resetPassword,
      body,
      signal,
    ),
  changePassword: (body: ChangePasswordRequest, signal?: AbortSignal) =>
    httpClient.post<void, ChangePasswordRequest>(
      AUTH_ROUTES.changePassword,
      body,
      signal,
    ),
}
