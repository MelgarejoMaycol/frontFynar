import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from './api'

export const notificationKeys = {
  all: (workspaceId: string) => ['notifications', workspaceId] as const,
  list: (workspaceId: string, status: 'ALL' | 'UNREAD' | 'READ', page: number, limit: number) =>
    ['notifications', workspaceId, 'list', status, page, limit] as const,
  summary: (workspaceId: string) => ['notifications', workspaceId, 'summary'] as const,
}

const useRefreshCache = (workspaceId: string) => {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: notificationKeys.all(workspaceId) })
}

export const useNotificationSummary = (workspaceId: string) =>
  useQuery({
    queryKey: notificationKeys.summary(workspaceId),
    queryFn: async ({ signal }) => {
      await notificationsApi.refresh(workspaceId)
      return (await notificationsApi.summary(workspaceId, signal)).data
    },
    enabled: Boolean(workspaceId),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })

export const useNotifications = (
  workspaceId: string,
  status: 'ALL' | 'UNREAD' | 'READ' = 'ALL',
  page = 1,
  limit = 30,
) =>
  useQuery({
    queryKey: notificationKeys.list(workspaceId, status, page, limit),
    queryFn: async ({ signal }) =>
      (await notificationsApi.list(workspaceId, { status, page, limit }, signal)).data,
    enabled: Boolean(workspaceId),
    staleTime: 30_000,
  })

export const useRefreshNotifications = (workspaceId: string) => {
  const refresh = useRefreshCache(workspaceId)
  return useMutation({
    mutationFn: () => notificationsApi.refresh(workspaceId),
    onSuccess: refresh,
  })
}

export const useReadNotification = (workspaceId: string) => {
  const refresh = useRefreshCache(workspaceId)
  return useMutation({
    mutationFn: (id: string) => notificationsApi.read(workspaceId, id),
    onSuccess: refresh,
  })
}

export const useReadAllNotifications = (workspaceId: string) => {
  const refresh = useRefreshCache(workspaceId)
  return useMutation({
    mutationFn: () => notificationsApi.readAll(workspaceId),
    onSuccess: refresh,
  })
}

export const useDismissNotification = (workspaceId: string) => {
  const refresh = useRefreshCache(workspaceId)
  return useMutation({
    mutationFn: (id: string) => notificationsApi.dismiss(workspaceId, id),
    onSuccess: refresh,
  })
}
