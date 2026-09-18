import { httpClient, type ApiSuccess } from '@/services/http'
import type { AuthUser } from '@/features/auth/types/auth.types'
import { authApi } from '@/features/auth/api/auth.api'

export interface SecuritySession {
  id: string
  deviceName: string | null
  ipAddress: string | null
  userAgent: string | null
  lastActivityAt: string
  expiresAt: string
  current: boolean
}

export interface MfaStatus {
  enabled: boolean
  available: boolean
  unavailableReason: string | null
  recoveryCodesRemaining: number
}

export interface MfaSetup {
  secret: string
  otpauthUri: string
}

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string | null
  phone?: string | null
  avatarUrl?: string | null
}

export const settingsApi = {
  getProfile: (signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<AuthUser>>('/users/me', signal),
  updateProfile: (body: UpdateProfileInput, signal?: AbortSignal) =>
    httpClient.patch<ApiSuccess<AuthUser>, UpdateProfileInput>(
      '/users/me',
      body,
      signal,
    ),
  changePassword: authApi.changePassword,
  getMfaStatus: (signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<MfaStatus>>('/auth/mfa/status', signal),
  setupMfa: () =>
    httpClient.post<ApiSuccess<MfaSetup>, undefined>(
      '/auth/mfa/totp/setup',
      undefined,
    ),
  confirmMfa: (code: string) =>
    httpClient.post<ApiSuccess<{ recoveryCodes: string[] }>, { code: string }>(
      '/auth/mfa/totp/confirm',
      { code },
    ),
  disableMfa: (code: string) =>
    httpClient.post<void, { code: string }>('/auth/mfa/disable', { code }),
  regenerateRecoveryCodes: (code: string) =>
    httpClient.post<ApiSuccess<{ recoveryCodes: string[] }>, { code: string }>(
      '/auth/mfa/recovery-codes/regenerate',
      { code },
    ),
  getSessions: (signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<SecuritySession[]>>('/auth/sessions', signal),
  revokeSession: (sessionId: string) =>
    httpClient.delete<void>(`/auth/sessions/${encodeURIComponent(sessionId)}`),
  revokeOtherSessions: () =>
    httpClient.delete<void>('/auth/sessions/others'),
  requestEmailChange: (body: { newEmail: string; currentPassword: string }) =>
    httpClient.post<
      ApiSuccess<{ newEmail: string; expiresAt: string }>,
      typeof body
    >('/auth/email-change/request', body),
  confirmEmailChange: (body: { token: string }) =>
    httpClient.post<void, typeof body>('/auth/email-change/confirm', body),
  updateAvatar: (file: File, signal?: AbortSignal) => {
    const body = new FormData()
    body.append('avatar', file)
    return httpClient.patch<ApiSuccess<AuthUser>, FormData>(
      '/users/me/avatar',
      body,
      signal,
    )
  },
  deleteAccount: (confirmation: 'ELIMINAR') =>
    httpClient.delete<void, { confirmation: 'ELIMINAR' }>('/users/me', {
      confirmation,
    }),
}
