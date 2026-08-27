import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { budgetsApi } from '../api/budgets.api'
import type {
  BudgetFilters,
  BudgetInput,
  UpdateBudgetInput,
} from '../types/budget.types'
export const budgetKeys = {
  all: (w: string) => ['budgets', w] as const,
  list: (w: string, f: BudgetFilters) => ['budgets', w, 'list', f] as const,
  detail: (w: string, id: string) => ['budgets', w, 'detail', id] as const,
}
export const useBudgets = (w: string, f: BudgetFilters, enabled = true) =>
  useQuery({
    queryKey: budgetKeys.list(w, f),
    queryFn: async ({ signal }) => (await budgetsApi.list(w, f, signal)).data,
    enabled,
    staleTime: 60_000,
  })
export const useBudget = (w: string, id: string) =>
  useQuery({
    queryKey: budgetKeys.detail(w, id),
    queryFn: async ({ signal }) => (await budgetsApi.get(w, id, signal)).data,
    enabled: Boolean(id),
    staleTime: 60_000,
  })
export const useBudgetCycleRange = (w: string, enabled: boolean) =>
  useQuery({
    queryKey: [...budgetKeys.all(w), 'cycle-range'],
    queryFn: async ({ signal }) => (await budgetsApi.cycleRange(w, signal)).data,
    enabled,
    retry: false,
  })
const useRefresh = (w: string) => {
  const c = useQueryClient()
  return (id?: string) =>
    Promise.all([
      c.invalidateQueries({ queryKey: budgetKeys.all(w) }),
      c.invalidateQueries({ queryKey: ['dashboard', w] }),
      c.invalidateQueries({ queryKey: ['reports', w] }),
      ...(id
        ? [c.invalidateQueries({ queryKey: budgetKeys.detail(w, id) })]
        : []),
    ])
}
export const useCreateBudget = (w: string) => {
  const r = useRefresh(w)
  return useMutation({
    mutationFn: (i: BudgetInput) => budgetsApi.create(w, i),
    onSuccess: () => r(),
  })
}
export const useUpdateBudget = (w: string, id: string) => {
  const r = useRefresh(w)
  return useMutation({
    mutationFn: (i: UpdateBudgetInput) => budgetsApi.update(w, id, i),
    onSuccess: () => r(id),
  })
}
export const useArchiveBudget = (w: string) => {
  const r = useRefresh(w)
  return useMutation({
    mutationFn: (id: string) => budgetsApi.archive(w, id),
    onSuccess: (_, id) => r(id),
  })
}
export const useRestoreBudget = (w: string) => {
  const r = useRefresh(w)
  return useMutation({
    mutationFn: (id: string) => budgetsApi.restore(w, id),
    onSuccess: ({ data }) => r(data.id),
  })
}
