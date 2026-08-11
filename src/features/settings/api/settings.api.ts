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
  updateAvatar: (file: File, signal?: AbortSignal) => {
    const body = new FormData()
    body.append('avatar', file)
    return httpClient.patch<ApiSuccess<AuthUser>, FormData>(
      '/users/me/avatar',
      body,
      signal,
    )
  },
}
