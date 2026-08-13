import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  Card,
  CardPurchase,
  CreditEstimation,
  Debt,
  DebtInput,
  DebtList,
  LiabilitiesSummary,
  Obligation,
  ObligationInput,
  PrepaymentSimulation,
  Statement,
  Upcoming,
} from './types'
const b = (w: string) => `/workspaces/${w}`
export const liabilitiesApi = {
  summary: (w: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<LiabilitiesSummary>>(`${b(w)}/debts-summary`, s),
  upcoming: (w: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<Upcoming[]>>(`${b(w)}/upcoming-payments`, s),
  debts: (w: string, q: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<DebtList>>(`${b(w)}/debts?${q}`, s),
  debt: (w: string, id: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<Debt>>(`${b(w)}/debts/${id}`, s),
  createDebt: (w: string, i: DebtInput) =>
    httpClient.post<ApiSuccess<Debt>, DebtInput>(`${b(w)}/debts`, i),
  estimate: (w: string, i: Record<string, unknown>) =>
    httpClient.post<ApiSuccess<CreditEstimation>, Record<string, unknown>>(
      `${b(w)}/debts/estimate`,
      i,
    ),
  updateInstallment: (
    w: string,
    d: string,
    id: string,
    i: { amount: string; recalculateFuture: boolean },
  ) =>
    httpClient.patch<ApiSuccess<unknown>, typeof i>(
      `${b(w)}/debts/${d}/installments/${id}`,
      i,
    ),
  payDebt: (w: string, d: string, id: string, i: Record<string, unknown>) =>
    httpClient.post<
      ApiSuccess<{ id: string; idempotent: boolean }>,
      Record<string, unknown>
    >(`${b(w)}/debts/${d}/installments/${id}/payments`, i),
  simulatePrepayment: (w: string, d: string, i: Record<string, unknown>) =>
    httpClient.post<ApiSuccess<PrepaymentSimulation>, Record<string, unknown>>(
      `${b(w)}/debts/${d}/prepayments/simulate`,
      i,
    ),
  prepay: (w: string, d: string, i: Record<string, unknown>) =>
    httpClient.post<ApiSuccess<unknown>, Record<string, unknown>>(
      `${b(w)}/debts/${d}/prepayments`,
      i,
    ),
  reconcile: (w: string, d: string, i: Record<string, unknown>) =>
    httpClient.post<
      ApiSuccess<{ id: string; difference: string }>,
      Record<string, unknown>
    >(`${b(w)}/debts/${d}/reconciliations`, i),
  obligations: (w: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<Obligation[]>>(`${b(w)}/obligations`, s),
  createObligation: (w: string, i: ObligationInput) =>
    httpClient.post<ApiSuccess<Obligation>, ObligationInput>(
      `${b(w)}/obligations`,
      i,
    ),
  updateObligation: (w: string, id: string, i: Partial<ObligationInput>) =>
    httpClient.patch<ApiSuccess<Obligation>, Partial<ObligationInput>>(
      `${b(w)}/obligations/${id}`,
      i,
    ),
  occurrence: (
    w: string,
    id: string,
    i: { dueDate: string; amount?: string },
  ) =>
    httpClient.post<ApiSuccess<unknown>, typeof i>(
      `${b(w)}/obligations/${id}/occurrences`,
      i,
    ),
  payOccurrence: (
    w: string,
    o: string,
    id: string,
    i: Record<string, unknown>,
  ) =>
    httpClient.post<ApiSuccess<unknown>, Record<string, unknown>>(
      `${b(w)}/obligations/${o}/occurrences/${id}/payments`,
      i,
    ),
  cards: (w: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<Card[]>>(`${b(w)}/cards`, s),
  purchases: (w: string, id: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<CardPurchase[]>>(
      `${b(w)}/cards/${id}/purchases`,
      s,
    ),
  purchase: (w: string, id: string, i: Record<string, unknown>) =>
    httpClient.post<ApiSuccess<unknown>, Record<string, unknown>>(
      `${b(w)}/cards/${id}/purchases`,
      i,
    ),
  statements: (w: string, id: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<Statement[]>>(
      `${b(w)}/cards/${id}/statements`,
      s,
    ),
  createStatement: (w: string, id: string, i: Record<string, unknown>) =>
    httpClient.post<ApiSuccess<Statement>, Record<string, unknown>>(
      `${b(w)}/cards/${id}/statements`,
      i,
    ),
  payCard: (w: string, c: string, id: string, i: Record<string, unknown>) =>
    httpClient.post<ApiSuccess<unknown>, Record<string, unknown>>(
      `${b(w)}/cards/${c}/statements/${id}/payments`,
      i,
    ),
}
