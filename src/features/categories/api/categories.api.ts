import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  Category,
  CategoryInput,
  UpdateCategoryInput,
} from '../types/category.types'
const base = (w: string) => `/workspaces/${w}/categories`
export const categoriesApi = {
  list: (
    w: string,
    status: 'ACTIVE' | 'ARCHIVED' | 'ALL' = 'ACTIVE',
    signal?: AbortSignal,
  ) =>
    httpClient.get<ApiSuccess<Category[]>>(
      `${base(w)}${status === 'ALL' ? '?includeArchived=true' : `?status=${status}`}`,
      signal,
    ),
  create: (w: string, i: CategoryInput) =>
    httpClient.post<ApiSuccess<Category>, CategoryInput>(base(w), i),
  update: (w: string, id: string, i: UpdateCategoryInput) =>
    httpClient.patch<ApiSuccess<Category>, UpdateCategoryInput>(
      `${base(w)}/${id}`,
      i,
    ),
  archive: (w: string, id: string) =>
    httpClient.delete<void>(`${base(w)}/${id}`),
  restore: (w: string, id: string) =>
    httpClient.post<ApiSuccess<Category>, undefined>(
      `${base(w)}/${id}/restore`,
      undefined,
    ),
}
