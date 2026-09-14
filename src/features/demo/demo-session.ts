import type { QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useWorkspaceStore } from '@/features/workspace/store/workspace.store'
import { applyTheme } from '@/features/workspace/theme'
import {
  clearDemoSession,
  demoPreferences,
  demoUser,
  demoWorkspace,
  markDemoSession,
} from './demo-mode'

export function activateDemoSession(queryClient: QueryClient) {
  markDemoSession()
  applyTheme(demoPreferences.theme)
  useAuthStore.getState().setAccessToken('fynar-demo-local')
  useWorkspaceStore.getState().setActiveWorkspaceId(demoWorkspace.id)
  queryClient.setQueryData(['auth', 'me'], demoUser)
  queryClient.setQueryData(['workspaces'], [demoWorkspace])
  queryClient.setQueryData(['users', 'me', 'preferences'], demoPreferences)
}

export function stopDemoSession() {
  clearDemoSession()
}
