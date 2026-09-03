import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { workspaceApi } from '../api/workspace.api'
import { useWorkspaceStore } from '../store/workspace.store'
import type {
  UpdateUserPreferences,
  UserPreferences,
  Workspace,
} from '../types/workspace.types'
import { applyTheme, subscribeTheme } from '../theme'
import { setDisplayPreferences } from '../display-preferences'
import {
  hasPermission,
  resolveActiveWorkspaceId,
} from '../workspace.resolution'

export const workspaceKeys = {
  all: ['workspaces'] as const,
  preferences: ['users', 'me', 'preferences'] as const,
}

export const workspaceDependentQueryRoots = [
  'accounts',
  'categories',
  'transactions',
  'dashboard',
  'budgets',
  'reports',
  'liabilities',
  'personal-balances',
  'lending',
] as const

export function useWorkspaces() {
  const authenticated = useAuthStore(
    (state) => state.status === 'authenticated',
  )
  return useQuery({
    queryKey: workspaceKeys.all,
    queryFn: async ({ signal }) => (await workspaceApi.list(signal)).data,
    enabled: authenticated,
    retry: false,
  })
}

export function usePreferences() {
  const authenticated = useAuthStore(
    (state) => state.status === 'authenticated',
  )
  const query = useQuery({
    queryKey: workspaceKeys.preferences,
    queryFn: async ({ signal }) =>
      (await workspaceApi.getPreferences(signal)).data,
    enabled: authenticated,
    retry: false,
  })
  useEffect(() => {
    if (query.data) {
      setDisplayPreferences(query.data)
      return subscribeTheme(query.data.theme)
    }
  }, [query.data])
  return query
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateUserPreferences) =>
      workspaceApi.updatePreferences(input),
    onSuccess: ({ data }) => {
      queryClient.setQueryData<UserPreferences>(workspaceKeys.preferences, data)
      applyTheme(data.theme)
      setDisplayPreferences(data)
      if (data.defaultWorkspaceId)
        useWorkspaceStore
          .getState()
          .setActiveWorkspaceId(data.defaultWorkspaceId)
      void queryClient.invalidateQueries({ queryKey: ['forecasts'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useActiveWorkspace() {
  const query = useWorkspaces()
  const activeWorkspaceId = useWorkspaceStore(
    (state) => state.activeWorkspaceId,
  )
  const setActiveWorkspaceId = useWorkspaceStore(
    (state) => state.setActiveWorkspaceId,
  )
  const resolvedId = resolveActiveWorkspaceId(
    query.data ?? [],
    activeWorkspaceId,
  )

  useEffect(() => {
    if (query.isSuccess && activeWorkspaceId !== resolvedId)
      setActiveWorkspaceId(resolvedId)
  }, [activeWorkspaceId, query.isSuccess, resolvedId, setActiveWorkspaceId])

  return {
    ...query,
    activeWorkspaceId: resolvedId,
    activeWorkspace: query.data?.find(({ id }) => id === resolvedId) ?? null,
  }
}

const updateSelectedWorkspace = (
  workspaces: readonly Workspace[] | undefined,
  selectedId: string,
): Workspace[] | undefined =>
  workspaces?.map((workspace) => ({
    ...workspace,
    isDefault: workspace.id === selectedId,
  }))

export function useSelectWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workspaceId: string) => workspaceApi.select(workspaceId),
    onSuccess: ({ data }) => {
      useWorkspaceStore.getState().setActiveWorkspaceId(data.defaultWorkspaceId)
      queryClient.setQueryData<Workspace[]>(workspaceKeys.all, (current) =>
        updateSelectedWorkspace(current, data.defaultWorkspaceId),
      )
      for (const root of workspaceDependentQueryRoots) {
        void queryClient.cancelQueries({ queryKey: [root] })
        queryClient.removeQueries({ queryKey: [root] })
      }
      void queryClient.cancelQueries({ queryKey: ['forecasts'] })
      queryClient.removeQueries({ queryKey: ['forecasts'] })
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.preferences,
      })
    },
  })
}

export function usePermission(permission: string): boolean {
  const { activeWorkspace } = useActiveWorkspace()
  if (activeWorkspace?.role === 'OWNER') return true
  return hasPermission(activeWorkspace?.permissions, permission)
}
