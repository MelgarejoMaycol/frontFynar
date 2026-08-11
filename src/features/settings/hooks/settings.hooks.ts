import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authMeKey } from '@/features/auth/hooks/auth.hooks'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { AuthUser } from '@/features/auth/types/auth.types'
import { settingsApi, type UpdateProfileInput } from '../api/settings.api'

export function useProfile() {
  const authenticated = useAuthStore(
    (state) => state.status === 'authenticated',
  )
  return useQuery({
    queryKey: authMeKey,
    queryFn: async ({ signal }) => (await settingsApi.getProfile(signal)).data,
    enabled: authenticated,
    retry: false,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => settingsApi.updateProfile(input),
    onSuccess: ({ data }) =>
      queryClient.setQueryData<AuthUser>(authMeKey, data),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      settingsApi.changePassword(input),
  })
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => settingsApi.updateAvatar(file),
    onSuccess: ({ data }) =>
      queryClient.setQueryData<AuthUser>(authMeKey, data),
  })
}
