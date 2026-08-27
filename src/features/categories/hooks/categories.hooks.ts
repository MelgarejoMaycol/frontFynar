import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '../api/categories.api'
import type {
  CategoryInput,
  UpdateCategoryInput,
} from '../types/category.types'
export const categoriesKeys = {
  all: (w: string) => ['categories', w] as const,
  list: (w: string, status: 'ACTIVE' | 'ARCHIVED' | 'ALL') =>
    status === 'ACTIVE'
      ? (['categories', w] as const)
      : (['categories', w, status] as const),
}
export const useCategories = (
  w: string,
  enabled = true,
  status: 'ACTIVE' | 'ARCHIVED' | 'ALL' = 'ACTIVE',
) =>
  useQuery({
    queryKey: categoriesKeys.list(w, status),
    queryFn: async ({ signal }) =>
      (await categoriesApi.list(w, status, signal)).data,
    enabled,
    staleTime: 5 * 60_000,
  })
const useRefresh = (w: string) => {
  const c = useQueryClient()
  return () => c.invalidateQueries({ queryKey: categoriesKeys.all(w) })
}
export const useCreateCategory = (w: string) => {
  const r = useRefresh(w)
  return useMutation({
    mutationFn: (i: CategoryInput) => categoriesApi.create(w, i),
    onSuccess: r,
  })
}
export const useUpdateCategory = (w: string, id: string) => {
  const r = useRefresh(w)
  return useMutation({
    mutationFn: (i: UpdateCategoryInput) => categoriesApi.update(w, id, i),
    onSuccess: r,
  })
}
export const useArchiveCategory = (w: string) => {
  const r = useRefresh(w)
  return useMutation({
    mutationFn: (id: string) => categoriesApi.archive(w, id),
    onSuccess: r,
  })
}
export const useRestoreCategory = (w: string) => {
  const r = useRefresh(w)
  return useMutation({
    mutationFn: (id: string) => categoriesApi.restore(w, id),
    onSuccess: r,
  })
}
