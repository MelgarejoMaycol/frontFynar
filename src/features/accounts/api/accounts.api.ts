import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  Account,
  AccountInput,
  UpdateAccountInput,
} from '../types/account.types'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/accounts`
export const accountsApi = {
  list: (
    workspaceId: string,
    archived = false,
    favorite?: true,
    excludeCreditCards = false,
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams({
      archived: String(archived),
      excludeCreditCards: String(excludeCreditCards),
    })
    if (favorite) query.set('favorite', 'true')
    return httpClient.get<ApiSuccess<Account[]>>(
      `${base(workspaceId)}?${query.toString()}`,
      signal,
    )
  },
  get: (workspaceId: string, accountId: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<Account>>(
      `${base(workspaceId)}/${accountId}`,
      signal,
    ),
  create: (workspaceId: string, input: AccountInput) =>
    httpClient.post<ApiSuccess<Account>, AccountInput>(
      base(workspaceId),
      input,
    ),
  update: (workspaceId: string, accountId: string, input: UpdateAccountInput) =>
    httpClient.patch<ApiSuccess<Account>, UpdateAccountInput>(
      `${base(workspaceId)}/${accountId}`,
      input,
    ),
  favorite: (workspaceId: string, accountId: string, isFavorite: boolean) =>
    httpClient.patch<ApiSuccess<Account>, { isFavorite: boolean }>(
      `${base(workspaceId)}/${accountId}/favorite`,
      { isFavorite },
    ),
  archive: (workspaceId: string, accountId: string) =>
    httpClient.post<ApiSuccess<Account>, undefined>(
      `${base(workspaceId)}/${accountId}/archive`,
      undefined,
    ),
  restore: (workspaceId: string, accountId: string) =>
    httpClient.post<ApiSuccess<Account>, undefined>(
      `${base(workspaceId)}/${accountId}/restore`,
      undefined,
    ),
  remove: (workspaceId: string, accountId: string) =>
    httpClient.delete<ApiSuccess<{ mode: 'PHYSICAL' | 'LOGICAL' }>>(
      `${base(workspaceId)}/${accountId}`,
    ),
}
