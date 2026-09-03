import { useMutation } from '@tanstack/react-query'
import { simulationsApi } from './api'
import type { PurchaseSimulationInput } from './types'

export function usePurchaseSimulation(workspaceId: string) {
  return useMutation({
    mutationFn: (input: PurchaseSimulationInput) =>
      simulationsApi.purchase(workspaceId, input).then((response) => response.data),
  })
}
