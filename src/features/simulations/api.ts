import { httpClient } from '@/services/http/httpClient'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  InvestmentFinancialImpactInput,
  InvestmentFinancialImpactResult,
  InvestmentScenarioInput,
  InvestmentScenarioResult,
  InvestmentSimulationInput,
  InvestmentSimulationOptions,
  InvestmentSimulationResult,
  PurchaseSimulationInput,
  PurchaseSimulationResult,
} from './types'

export const simulationsApi = {
  purchase: (workspaceId: string, input: PurchaseSimulationInput) =>
    httpClient.post<ApiSuccess<PurchaseSimulationResult>, PurchaseSimulationInput>(
      `/workspaces/${workspaceId}/simulations/purchase`,
      input,
    ),
  investmentOptions: (workspaceId: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<InvestmentSimulationOptions>>(
      `/workspaces/${workspaceId}/simulations/investment/options`,
      signal,
    ),
  calculateInvestment: (workspaceId: string, input: InvestmentSimulationInput) =>
    httpClient.post<ApiSuccess<InvestmentSimulationResult>, InvestmentSimulationInput>(
      `/workspaces/${workspaceId}/simulations/investment/calculate`,
      input,
    ),
  investmentScenarios: (workspaceId: string, input: InvestmentScenarioInput) =>
    httpClient.post<ApiSuccess<InvestmentScenarioResult>, InvestmentScenarioInput>(
      `/workspaces/${workspaceId}/simulations/investment/scenarios`,
      input,
    ),
  investmentFinancialImpact: (
    workspaceId: string,
    input: InvestmentFinancialImpactInput,
  ) =>
    httpClient.post<
      ApiSuccess<InvestmentFinancialImpactResult>,
      InvestmentFinancialImpactInput
    >(
      `/workspaces/${workspaceId}/simulations/investment/financial-impact`,
      input,
    ),
}
