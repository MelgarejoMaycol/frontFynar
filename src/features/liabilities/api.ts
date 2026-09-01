import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  Card,
  CardActivity,
  CardCashAdvanceInput,
  CardCashAdvanceResult,
  CardPaymentInput,
  CardPaymentResult,
  CardPurchase,
  CreditEstimation,
  Debt,
  DebtEstimateInput,
  DebtInput,
  DebtList,
  DebtPaymentInput,
  DebtPaymentResult,
  LiabilitiesSummary,
  Obligation,
  ObligationInput,
  ObligationPayment,
  PrepaymentSimulation,
  Statement,
  Upcoming,
} from './types'
const b = (w: string) => `/workspaces/${w}`
export const liabilitiesApi = {
  summary: (w: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<LiabilitiesSummary>>(`${b(w)}/debts-summary`, s),
  upcoming: (w: string, s?: AbortSignal, range?: { from?: string; to?: string }) =>
    httpClient.get<ApiSuccess<Upcoming[]>>(
      `${b(w)}/upcoming-payments${range ? `?mode=calendar&from=${range.from ?? ''}&to=${range.to ?? ''}` : ''}`,
      s,
    ),
  calendarRange: (w: string, from: string, to: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<Upcoming[]>>(
      `${b(w)}/upcoming-payments?mode=calendar&from=${from}&to=${to}`,
      s,
    ),
  debts: (w: string, q: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<DebtList>>(`${b(w)}/debts?${q}`, s),
  debt: (w: string, id: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<Debt>>(`${b(w)}/debts/${id}`, s),
  createDebt: (w: string, i: DebtInput) =>
    httpClient.post<ApiSuccess<Debt>, DebtInput>(`${b(w)}/debts`, i),
  deleteDebt: (w: string, id: string) =>
    httpClient.delete<ApiSuccess<{ mode: 'PHYSICAL' | 'LOGICAL' }>>(
      `${b(w)}/debts/${id}`,
    ),
  estimate: (w: string, i: DebtEstimateInput) =>
    httpClient.post<ApiSuccess<CreditEstimation>, DebtEstimateInput>(
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
  payDebt: (w: string, d: string, id: string, i: DebtPaymentInput) =>
    httpClient.post<ApiSuccess<DebtPaymentResult>, DebtPaymentInput>(
      `${b(w)}/debts/${d}/installments/${id}/payments`,
      i,
    ),
  reverseDebtPayment: (w: string, d: string, id: string, reason: string) =>
    httpClient.post<ApiSuccess<unknown>, { reason: string }>(
      `${b(w)}/debts/${d}/payments/${id}/reverse`,
      { reason },
    ),
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
  obligations: (w: string, archived = false, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<Obligation[]>>(
      `${b(w)}/obligations${archived ? '?archived=true' : ''}`,
      s,
    ),
  obligation: (w: string, id: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<Obligation>>(`${b(w)}/obligations/${id}`, s),
  createObligation: (w: string, i: ObligationInput) =>
    httpClient.post<ApiSuccess<Obligation>, ObligationInput>(
      `${b(w)}/obligations`,
      i,
    ),
  updateObligation: (
    w: string,
    id: string,
    i: Partial<ObligationInput> & { status?: Obligation['status'] },
  ) =>
    httpClient.patch<
      ApiSuccess<Obligation>,
      Partial<ObligationInput> & { status?: Obligation['status'] }
    >(`${b(w)}/obligations/${id}`, i),
  deleteObligation: (w: string, id: string) =>
    httpClient.delete<ApiSuccess<{ mode: 'PHYSICAL' | 'LOGICAL' }>>(
      `${b(w)}/obligations/${id}`,
    ),
  restoreObligation: (w: string, id: string) =>
    httpClient.post<ApiSuccess<Obligation>, Record<string, never>>(
      `${b(w)}/obligations/${id}/restore`,
      {},
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
  updateOccurrencePayment: (
    w: string,
    obligationId: string,
    paymentId: string,
    input: Record<string, unknown>,
  ) =>
    httpClient.patch<ApiSuccess<ObligationPayment>, Record<string, unknown>>(
      `${b(w)}/obligations/${obligationId}/payments/${paymentId}`,
      input,
    ),
  reverseOccurrencePayment: (
    w: string,
    obligationId: string,
    paymentId: string,
    input: { reason: string; version: number },
  ) =>
    httpClient.post<ApiSuccess<unknown>, typeof input>(
      `${b(w)}/obligations/${obligationId}/payments/${paymentId}/reverse`,
      input,
    ),
  cards: (w: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<Card[]>>(`${b(w)}/cards`, s),
  createCard: (w: string, i: Record<string, unknown>) =>
    httpClient.post<ApiSuccess<Card>, Record<string, unknown>>(
      `${b(w)}/cards`,
      i,
    ),
  updateCard: (w: string, id: string, i: Record<string, unknown>) =>
    httpClient.patch<ApiSuccess<Card>, Record<string, unknown>>(
      `${b(w)}/cards/${id}`,
      i,
    ),
  deleteCard: (w: string, id: string) =>
    httpClient.delete<ApiSuccess<{ mode: 'PHYSICAL' | 'LOGICAL' }>>(
      `${b(w)}/cards/${id}`,
    ),
  cashAdvance: (w: string, c: string, i: CardCashAdvanceInput) =>
    httpClient.post<ApiSuccess<CardCashAdvanceResult>, CardCashAdvanceInput>(
      `${b(w)}/cards/${c}/cash-advances`,
      i,
    ),
  purchases: (w: string, id: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<CardPurchase[]>>(
      `${b(w)}/cards/${id}/purchases`,
      s,
    ),
  activity: (w: string, id: string, s?: AbortSignal) =>
    httpClient.get<ApiSuccess<CardActivity[]>>(
      `${b(w)}/cards/${id}/activity`,
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
  updateNextPayment: (w: string, id: string, i: Record<string, unknown>) =>
    httpClient.post<ApiSuccess<unknown>, Record<string, unknown>>(
      `${b(w)}/cards/${id}/next-payment`,
      i,
    ),
  payCard: (w: string, c: string, id: string, i: CardPaymentInput) =>
    httpClient.post<ApiSuccess<CardPaymentResult>, CardPaymentInput>(
      `${b(w)}/cards/${c}/statements/${id}/payments`,
      i,
    ),
  payCardBalance: (w: string, c: string, i: CardPaymentInput) =>
    httpClient.post<ApiSuccess<CardPaymentResult>, CardPaymentInput>(
      `${b(w)}/cards/${c}/payments`,
      i,
    ),
}
