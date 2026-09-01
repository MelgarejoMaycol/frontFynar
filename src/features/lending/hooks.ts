import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts'
import { lendingApi } from './api'
import type { CreateLoanInput, LendingStatus, LoanPaymentInput, SimulationInput } from './types'
export const lendingKeys = { all: (w: string) => ['lending', w] as const, summary: (w: string) => ['lending', w, 'summary'] as const, list: (w: string, f: object) => ['lending', w, 'list', f] as const, detail: (w: string, id: string) => ['lending', w, 'detail', id] as const }
export const useLendingSummary = (w: string) => useQuery({ queryKey: lendingKeys.summary(w), queryFn: async ({ signal }) => (await lendingApi.summary(w, signal)).data, enabled: Boolean(w) })
export const useLoans = (w: string, filters: { q?: string; status?: LendingStatus | 'ALL' }) => useQuery({ queryKey: lendingKeys.list(w, filters), queryFn: async ({ signal }) => (await lendingApi.list(w, filters, signal)).data, enabled: Boolean(w) })
export const useLoan = (w: string, id: string) => useQuery({ queryKey: lendingKeys.detail(w, id), queryFn: async ({ signal }) => (await lendingApi.get(w, id, signal)).data, enabled: Boolean(w && id) })
export const useAssetAccounts = (w: string) => useQuery({ queryKey: ['accounts', w, 'lending-assets'], queryFn: async ({ signal }) => (await accountsApi.list(w, false, undefined, true, signal)).data.filter((a) => a.nature === 'ASSET' && a.type !== 'LOAN'), enabled: Boolean(w) })
const useRefresh = (w: string) => { const client = useQueryClient(); return async () => { await Promise.all([client.invalidateQueries({ queryKey: lendingKeys.all(w) }), client.invalidateQueries({ queryKey: ['accounts', w] }), client.invalidateQueries({ queryKey: ['dashboard', w] }), client.invalidateQueries({ queryKey: ['transactions', w] })]) } }
export const useSimulation = (w: string) => useMutation({ mutationFn: (input: SimulationInput) => lendingApi.simulate(w, input) })
export const useCreateLoan = (w: string) => { const refresh = useRefresh(w); return useMutation({ mutationFn: (input: CreateLoanInput) => lendingApi.create(w, input), onSuccess: refresh }) }
export const usePayLoan = (w: string, loanId: string, installmentId: string) => { const refresh = useRefresh(w); return useMutation({ mutationFn: (input: LoanPaymentInput) => lendingApi.pay(w, loanId, installmentId, input), onSuccess: refresh }) }
export const useReverseLoanPayment = (w: string, loanId: string) => { const refresh = useRefresh(w); return useMutation({ mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) => lendingApi.reverse(w, loanId, paymentId, reason), onSuccess: refresh }) }
export const useArchiveLoan = (w: string) => { const refresh = useRefresh(w); return useMutation({ mutationFn: (loanId: string) => lendingApi.archive(w, loanId), onSuccess: refresh }) }
