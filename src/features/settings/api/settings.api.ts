import { httpClient, type ApiSuccess } from '@/services/http'
import type { AuthUser } from '@/features/auth/types/auth.types'
import { authApi } from '@/features/auth/api/auth.api'

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
