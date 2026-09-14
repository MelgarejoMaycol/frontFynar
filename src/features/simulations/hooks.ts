import { useMutation, useQuery } from '@tanstack/react-query'
import { simulationsApi } from './api'
import type {
  InvestmentFinancialImpactInput,
  InvestmentScenarioInput,
  InvestmentSimulationInput,
  PurchaseSimulationInput,
} from './types'

export function usePurchaseSimulation(workspaceId: string) {
  return useMutation({
    mutationFn: (input: PurchaseSimulationInput) =>
      simulationsApi.purchase(workspaceId, input).then((response) => response.data),
  })
}


export function useInvestmentSimulationOptions(
  workspaceId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ['simulations', workspaceId, 'investment', 'options'],
    queryFn: ({ signal }) =>
      simulationsApi
        .investmentOptions(workspaceId, signal)
        .then((response) => response.data),
    enabled: Boolean(workspaceId) && enabled,
    staleTime: 60 * 60 * 1000,
  })
}

export function useInvestmentSimulation(workspaceId: string) {
  return useMutation({
    mutationFn: (input: InvestmentSimulationInput) =>
      simulationsApi
        .calculateInvestment(workspaceId, input)
        .then((response) => response.data),
  })
}

export function useInvestmentScenarios(workspaceId: string) {
  return useMutation({
    mutationFn: (input: InvestmentScenarioInput) =>
      simulationsApi
        .investmentScenarios(workspaceId, input)
        .then((response) => response.data),
  })
}

export function useInvestmentFinancialImpact(workspaceId: string) {
  return useMutation({
    mutationFn: (input: InvestmentFinancialImpactInput) =>
      simulationsApi
        .investmentFinancialImpact(workspaceId, input)
        .then((response) => response.data),
  })
}
