import { httpClient } from '@/services/http/httpClient'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type { PurchaseSimulationInput, PurchaseSimulationResult } from './types'

export const simulationsApi = {
  purchase: (workspaceId: string, input: PurchaseSimulationInput) =>
    httpClient.post<ApiSuccess<PurchaseSimulationResult>, PurchaseSimulationInput>(
      `/workspaces/${workspaceId}/simulations/purchase`,
      input,
    ),
}
