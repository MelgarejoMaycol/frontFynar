import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  UserPreferences,
  UpdateUserPreferences,
  Workspace,
  WorkspaceSelection,
} from '../types/workspace.types'

export const workspaceApi = {
  list: (signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<Workspace[]>>('/workspaces', signal),
  select: (workspaceId: string) =>
    httpClient.post<ApiSuccess<WorkspaceSelection>, undefined>(
      `/workspaces/${workspaceId}/select`,
      undefined,
    ),
  getPreferences: (signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<UserPreferences>>(
      '/users/me/preferences',
      signal,
    ),
  updatePreferences: (body: UpdateUserPreferences, signal?: AbortSignal) =>
    httpClient.patch<ApiSuccess<UserPreferences>, UpdateUserPreferences>(
      '/users/me/preferences',
      body,
      signal,
    ),
}
