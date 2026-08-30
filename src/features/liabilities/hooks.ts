import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { liabilitiesApi } from './api'
import type { DebtInput, ObligationInput } from './types'
export const liabilityKeys = {
  all: (w: string) => ['liabilities', w] as const,
  summary: (w: string) => ['liabilities', w, 'summary'] as const,
  upcoming: (w: string) => ['liabilities', w, 'upcoming'] as const,
  debts: (w: string, q: string) => ['liabilities', w, 'debts', q] as const,
  debt: (w: string, id: string) => ['liabilities', w, 'debt', id] as const,
  obligations: (w: string, archived = false) =>
    ['liabilities', w, 'obligations', archived ? 'archived' : 'active'] as const,
  obligation: (w: string, id: string) =>
    ['liabilities', w, 'obligation', id] as const,
  cards: (w: string) => ['liabilities', w, 'cards'] as const,
  statements: (w: string, c: string) =>
    ['liabilities', w, 'cards', c, 'statements'] as const,
  purchases: (w: string, c: string) =>
    ['liabilities', w, 'cards', c, 'purchases'] as const,
  activity: (w: string, c: string) =>
    ['liabilities', w, 'cards', c, 'activity'] as const,
}

type LiabilitiesSection = 'summary' | 'debts' | 'cards' | 'obligations'

const isMainLiabilitiesSectionActive = (section: LiabilitiesSection) => {
  if (typeof window === 'undefined') return true
  const pathname = window.location.pathname.replace(/\/+$/, '')
  if (pathname !== '/app/debts') return true
  const selected = new URLSearchParams(window.location.search).get('tab') ?? 'summary'
  return selected === section
}

export const useSummary = (w: string, enabled = true) =>
  useQuery({
    queryKey: liabilityKeys.summary(w),
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.summary(w, signal)).data,
    enabled: Boolean(w) && enabled && isMainLiabilitiesSectionActive('summary'),
    staleTime: 30_000,
  })
export const useUpcoming = (w: string, enabled = true) =>
  useQuery({
    queryKey: liabilityKeys.upcoming(w),
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.upcoming(w, signal)).data,
    enabled: Boolean(w) && enabled && isMainLiabilitiesSectionActive('summary'),
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
export const useDebts = (w: string, q: string, enabled = true) =>
  useQuery({
    queryKey: liabilityKeys.debts(w, q),
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.debts(w, q, signal)).data,
    enabled: Boolean(w) && enabled && isMainLiabilitiesSectionActive('debts'),
  })
export const useDebt = (w: string, id: string) =>
  useQuery({
    queryKey: liabilityKeys.debt(w, id),
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.debt(w, id, signal)).data,
    enabled: Boolean(id),
  })
export const useObligations = (w: string, archived = false, enabled = true) =>
  useQuery({
    queryKey: liabilityKeys.obligations(w, archived),
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.obligations(w, archived, signal)).data,
    enabled:
      Boolean(w) && enabled && isMainLiabilitiesSectionActive('obligations'),
  })
export const useObligation = (w: string, id: string) =>
  useQuery({
    queryKey: liabilityKeys.obligation(w, id),
    queryFn: async ({ signal }) =>
      (await liabilitiesApi.obligation(w, id, signal)).data,
    enabled: Boolean(w && id),
  })
export const useCards = (w: string, enabled = true) =>
  useQuery({
    queryKey: liabilityKeys.cards(w),
    queryFn: async ({ signal }) => (await liabilitiesApi.cards(w, signal)).data,
    enabled: Boolean(w) && enabled && isMainLiabilitiesSectionActive('cards'),
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
