import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth.api'
import { useAuthStore } from '../store/auth.store'
import type { LoginRequest, RegisterRequest } from '../types/auth.types'
import { useWorkspaceStore } from '@/features/workspace/store/workspace.store'

export const authMeKey = ['auth', 'me'] as const

export function useSession() {
  const status = useAuthStore((state) => state.status)
  return useQuery({
    queryKey: authMeKey,
    queryFn: async ({ signal }) => (await authApi.getCurrentUser(signal)).data,
    enabled: status === 'authenticated',
    retry: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginRequest) => authApi.login(input),
    onSuccess: ({ data }) => {
      useAuthStore.getState().setAccessToken(data.tokens.accessToken)
      queryClient.setQueryData(authMeKey, data.user)
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterRequest) => authApi.register(input),
  })
}
export const useResendVerification = () =>
  useMutation({
    mutationFn: (email: string) => authApi.resendVerification({ email }),
  })
export const useVerifyEmail = () =>
  useMutation({ mutationFn: (token: string) => authApi.verifyEmail({ token }) })

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await authApi.logout()
    },
    onSettled: async () => {
      useAuthStore.getState().clearSession()
      useWorkspaceStore.getState().clearWorkspace()
      await queryClient.cancelQueries()
      queryClient.removeQueries()
    },
  })
}

export function useLogoutAll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSuccess: async () => {
      useAuthStore.getState().clearSession()
      useWorkspaceStore.getState().clearWorkspace()
      await queryClient.cancelQueries()
      queryClient.removeQueries()
    },
  })
}
