import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authMeKey } from '@/features/auth/hooks/auth.hooks'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useWorkspaceStore } from '@/features/workspace/store/workspace.store'
import type { AuthUser } from '@/features/auth/types/auth.types'
import { settingsApi, type UpdateProfileInput } from '../api/settings.api'

export const mfaStatusKey = ['settings', 'security', 'mfa'] as const
export const sessionsKey = ['settings', 'security', 'sessions'] as const

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

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => settingsApi.deleteAccount('ELIMINAR'),
    onSuccess: async () => {
      useAuthStore.getState().clearSession()
      useWorkspaceStore.getState().clearWorkspace()
      await queryClient.cancelQueries()
      queryClient.removeQueries()
    },
  })
}

export function useMfaStatus() {
  return useQuery({
    queryKey: mfaStatusKey,
    queryFn: async ({ signal }) => (await settingsApi.getMfaStatus(signal)).data,
  })
}
export function useSetupMfa() {
  return useMutation({ mutationFn: () => settingsApi.setupMfa() })
}
export function useConfirmMfa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => settingsApi.confirmMfa(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mfaStatusKey }),
  })
}
export function useDisableMfa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => settingsApi.disableMfa(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mfaStatusKey }),
  })
}
export function useRegenerateRecoveryCodes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => settingsApi.regenerateRecoveryCodes(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mfaStatusKey }),
  })
}
export function useSecuritySessions() {
  return useQuery({
    queryKey: sessionsKey,
    queryFn: async ({ signal }) => (await settingsApi.getSessions(signal)).data,
  })
}
export function useRevokeSecuritySession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => settingsApi.revokeSession(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey }),
  })
}
export function useRevokeOtherSecuritySessions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => settingsApi.revokeOtherSessions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey }),
  })
}
