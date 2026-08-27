import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { liabilitiesApi } from './api'
import type { DebtInput, ObligationInput } from './types'
export const liabilityKeys = {
  all: (w: string) => ['liabilities', w] as const,
  summary: (w: string) => ['liabilities', w, 'summary'] as const,
  upcoming: (w: string) => ['liabilities', w, 'upcoming'] as const,
  debts: (w: string, q: string) => ['liabilities', w, 'debts', q] as const,
  debt: (w: string, id: string) => ['liabilities', w, 'debt', id] as const,
  obligations: (w: string) => ['liabilities', w, 'obligations'] as const,
  cards: (w: string) => ['liabilities', w, 'cards'] as const,
  statements: (w: string, c: string) =>
    ['liabilities', w, 'cards', c, 'statements'] as const,
  purchases: (w: string, c: string) =>
    ['liabilities', w, 'cards', c, 'purchases'] as const,
  activity: (w: string, c: string) =>
    ['liabilities', w, 'cards', c, 'activity'] as const,
}
export const useSummary = (w: string) =>
  useQuery({
    queryKey: liabilityKeys.summary(w),
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.summary(w, signal)).data,
    enabled: Boolean(w),
    staleTime: 30_000,
  })
export const useUpcoming = (w: string) =>
  useQuery({
    queryKey: liabilityKeys.upcoming(w),
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.upcoming(w, signal)).data,
    enabled: Boolean(w),
    staleTime: 30_000,
  })
export const useCalendarRange = (w: string, from: string, to: string) =>
  useQuery({
    queryKey: ['liabilities', w, 'calendar', from, to] as const,
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.calendarRange(w, from, to, signal)).data,
    enabled: Boolean(w && from && to),
    staleTime: 30_000,
  })
export const useDebts = (w: string, q: string) =>
  useQuery({
    queryKey: liabilityKeys.debts(w, q),
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.debts(w, q, signal)).data,
  })
export const useDebt = (w: string, id: string) =>
  useQuery({
    queryKey: liabilityKeys.debt(w, id),
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.debt(w, id, signal)).data,
    enabled: Boolean(id),
  })
export const useObligations = (w: string) =>
  useQuery({
    queryKey: liabilityKeys.obligations(w),
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.obligations(w, signal)).data,
  })
export const useCards = (w: string) =>
  useQuery({
    queryKey: liabilityKeys.cards(w),
    queryFn: async ({ signal }) => (await liabilitiesApi.cards(w, signal)).data,
    staleTime: 30_000,
  })
export const useStatements = (w: string, c: string) =>
  useQuery({
    queryKey: liabilityKeys.statements(w, c),
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.statements(w, c, signal)).data,
    enabled: Boolean(c),
  })
export const usePurchases = (w: string, c: string) =>
  useQuery({
    queryKey: liabilityKeys.purchases(w, c),
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.purchases(w, c, signal)).data,
    enabled: Boolean(c),
  })
export const useCardActivity = (w: string, c: string) =>
  useQuery({
    queryKey: liabilityKeys.activity(w, c),
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.activity(w, c, signal)).data,
    enabled: Boolean(c),
  })
const useRefresh = (w: string) => {
  const c = useQueryClient()
  return async (extra?: readonly unknown[]) => {
    await Promise.all([
      c.invalidateQueries({ queryKey: liabilityKeys.all(w) }),
      c.invalidateQueries({ queryKey: ['accounts', w] }),
      c.invalidateQueries({ queryKey: ['dashboard', w] }),
      c.invalidateQueries({ queryKey: ['reports', w] }),
      c.invalidateQueries({ queryKey: ['transactions', w] }),
      ...(extra ? [c.invalidateQueries({ queryKey: extra })] : []),
    ])
  }
}
export const useLiabilityMutation = <T, R = unknown>(
  w: string,
  fn: (input: T) => Promise<R>,
  extra?: readonly unknown[],
) => {
  const refresh = useRefresh(w)
  return useMutation({ mutationFn: fn, onSuccess: () => refresh(extra) })
}
export const useCreateDebt = (w: string) =>
  useLiabilityMutation<DebtInput>(w, (i) => liabilitiesApi.createDebt(w, i))
export const useCreateObligation = (w: string) =>
  useLiabilityMutation<ObligationInput>(w, (i) =>
    liabilitiesApi.createObligation(w, i),
  )
