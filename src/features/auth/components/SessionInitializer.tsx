import { useEffect, useRef, type PropsWithChildren } from 'react'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type { AuthUser } from '../types/auth.types'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth.api'
import { refreshAccessToken } from '@/services/http/httpClient'
import { registerPrivateCacheCleaner } from '../session-events'
import { useAuthStore } from '../store/auth.store'
import { authMeKey } from '../hooks/auth.hooks'
import { useWorkspaceStore } from '@/features/workspace/store/workspace.store'

type Props = PropsWithChildren<{
  refresh?: () => Promise<string>
  loadUser?: () => Promise<ApiSuccess<AuthUser>>
}>

export function SessionInitializer({
  children,
  refresh = refreshAccessToken,
  loadUser = authApi.getCurrentUser,
}: Props) {
  const queryClient = useQueryClient()
  const initializationStarted = useRef(false)
  useEffect(
    () =>
      registerPrivateCacheCleaner(() => {
        useWorkspaceStore.getState().clearWorkspace()
        void queryClient.cancelQueries()
        queryClient.removeQueries()
      }),
    [queryClient],
  )
  useEffect(() => {
    if (initializationStarted.current) return
    initializationStarted.current = true
    const initialize = async () => {
      try {
        await refresh()
        await queryClient.fetchQuery({
          queryKey: authMeKey,
          queryFn: async () => (await loadUser()).data,
        })
      } catch {
        useAuthStore.getState().clearSession()
        useWorkspaceStore.getState().clearWorkspace()
        queryClient.removeQueries()
      }
    }
    void initialize()
  }, [loadUser, queryClient, refresh])
  return children
}
