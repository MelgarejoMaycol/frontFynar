import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'

export type RecurringDetectionFrequency =
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'BIMONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'

export type RecurringDetectionAmountType = 'FIXED' | 'VARIABLE'

export interface RecurringDetectionCandidate {
  fingerprint: string
  normalizedLabel: string
  displayLabel: string
  frequency: RecurringDetectionFrequency
  amountType: RecurringDetectionAmountType
  typicalAmount: number
  minAmount: number
  maxAmount: number
  confidence: number
  evidenceCount: number
  transactionIds: string[]
  firstSeenAt: string
  lastSeenAt: string
  nextExpectedAt: string
  accountId: string | null
  categoryId: string | null
  reasons: string[]
}

export interface RecurringSuggestion {
  id: string
  candidate: RecurringDetectionCandidate
}

export interface RecurringDetectionScan {
  generatedAt: string
  analysisMonths: number
  analyzedTransactions: number
  detectedCandidates: number
  suggestions: RecurringSuggestion[]
}

export interface ConfirmRecurringSuggestionInput {
  months?: number
  name?: string
  description?: string | null
  expectedAmount?: string
  amountType?: RecurringDetectionAmountType
  paymentAccountId?: string | null
  categoryId?: string | null
  remindersEnabled?: boolean
  frequency?: RecurringDetectionFrequency
  startsOn?: string
}

const base = (workspaceId: string) =>
  `/workspaces/${workspaceId}/recurring-detection`

export const recurringDetectionApi = {
  suggestions: (workspaceId: string, months = 12, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<RecurringDetectionScan>>(
      `${base(workspaceId)}/suggestions?months=${months}`,
      signal,
    ),
  run: (workspaceId: string, months = 12) =>
    httpClient.post<ApiSuccess<RecurringDetectionScan>, { months: number }>(
      `${base(workspaceId)}/run`,
      { months },
    ),
  dismiss: (workspaceId: string, suggestionId: string) =>
    httpClient.post<
      ApiSuccess<{ id: string; dismissedUntil: string }>,
      Record<string, never>
    >(`${base(workspaceId)}/suggestions/${suggestionId}/dismiss`, {}),
  confirm: (
    workspaceId: string,
    suggestionId: string,
    input: ConfirmRecurringSuggestionInput,
  ) =>
    httpClient.post<ApiSuccess<unknown>, ConfirmRecurringSuggestionInput>(
      `${base(workspaceId)}/suggestions/${suggestionId}/confirm`,
      input,
    ),
}
