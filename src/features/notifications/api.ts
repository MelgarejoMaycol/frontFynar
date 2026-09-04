import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS'
export type NotificationType =
  | 'BUDGET_ALERT'
  | 'PAYMENT_DUE'
  | 'LIQUIDITY_RISK'
  | 'UNUSUAL_SPENDING'
  | 'INCOME_DROP'
  | 'GOAL_PROGRESS'
  | 'SYSTEM'

export interface SmartNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  severity: AlertSeverity
  source: string
  sourceId: string | null
  actionUrl: string | null
  actionLabel: string | null
  context: Record<string, string | number | boolean | null>
  scheduledFor: string | null
  sentAt: string | null
  readAt: string | null
  dismissedAt: string | null
  createdAt: string
}

export interface NotificationList {
  items: SmartNotification[]
  page: number
  limit: number
  total: number
  totalPages: number
  unread: number
}

const base = (workspaceId: string) => `/workspaces/${workspaceId}/notifications`

export const notificationsApi = {
  list: (
    workspaceId: string,
    params: { status?: 'ALL' | 'UNREAD' | 'READ'; page?: number; limit?: number } = {},
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams()
    if (params.status) query.set('status', params.status)
    if (params.page) query.set('page', String(params.page))
    if (params.limit) query.set('limit', String(params.limit))
    const suffix = query.size ? `?${query.toString()}` : ''
    return httpClient.get<ApiSuccess<NotificationList>>(`${base(workspaceId)}${suffix}`, signal)
  },
  summary: (workspaceId: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<{ unread: number }>>(`${base(workspaceId)}/summary`, signal),
  refresh: (workspaceId: string) =>
    httpClient.post<ApiSuccess<{ evaluated: number; created: number }>, Record<string, never>>(
      `${base(workspaceId)}/refresh`,
      {},
    ),
  read: (workspaceId: string, id: string) =>
    httpClient.post<ApiSuccess<{ id: string; readAt: string }>, Record<string, never>>(
      `${base(workspaceId)}/${id}/read`,
      {},
    ),
  readAll: (workspaceId: string) =>
    httpClient.post<ApiSuccess<{ updated: number }>, Record<string, never>>(
      `${base(workspaceId)}/read-all`,
      {},
    ),
  dismiss: (workspaceId: string, id: string) =>
    httpClient.post<ApiSuccess<{ id: string; dismissedAt: string }>, Record<string, never>>(
      `${base(workspaceId)}/${id}/dismiss`,
      {},
    ),
}
