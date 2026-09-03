import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { goalsApi } from '../api/goals.api'
import type {
  GoalContributionInput,
  GoalFilters,
  GoalInput,
  UpdateGoalInput,
} from '../types/goal.types'

export const goalKeys = {
  all: (workspaceId: string) => ['goals', workspaceId] as const,
  list: (workspaceId: string, filters: GoalFilters) =>
    ['goals', workspaceId, 'list', filters] as const,
  detail: (workspaceId: string, goalId: string) =>
    ['goals', workspaceId, 'detail', goalId] as const,
  projection: (workspaceId: string, goalId: string) =>
    ['goals', workspaceId, 'projection', goalId] as const,
}

export const useGoals = (
  workspaceId: string,
  filters: GoalFilters,
  enabled = true,
) =>
  useQuery({
    queryKey: goalKeys.list(workspaceId, filters),
    queryFn: async ({ signal }) =>
      (await goalsApi.list(workspaceId, filters, signal)).data,
    enabled,
    staleTime: 60_000,
  })

export const useGoal = (workspaceId: string, goalId: string) =>
  useQuery({
    queryKey: goalKeys.detail(workspaceId, goalId),
    queryFn: async ({ signal }) =>
      (await goalsApi.get(workspaceId, goalId, signal)).data,
    enabled: Boolean(goalId),
    staleTime: 30_000,
  })

export const useGoalProjection = (workspaceId: string, goalId: string) =>
  useQuery({
    queryKey: goalKeys.projection(workspaceId, goalId),
    queryFn: async ({ signal }) =>
      (await goalsApi.projection(workspaceId, goalId, signal)).data,
    enabled: Boolean(goalId),
    staleTime: 30_000,
  })

const useRefreshGoals = (workspaceId: string) => {
  const client = useQueryClient()
  return async (goalId?: string) => {
    await Promise.all([
      client.invalidateQueries({ queryKey: goalKeys.all(workspaceId) }),
      client.invalidateQueries({ queryKey: ['accounts', workspaceId] }),
      client.invalidateQueries({ queryKey: ['dashboard', workspaceId] }),
      ...(goalId
        ? [
            client.invalidateQueries({
              queryKey: goalKeys.detail(workspaceId, goalId),
            }),
            client.invalidateQueries({
              queryKey: goalKeys.projection(workspaceId, goalId),
            }),
          ]
        : []),
    ])
  }
}

export const useCreateGoal = (workspaceId: string) => {
  const refresh = useRefreshGoals(workspaceId)
  return useMutation({
    mutationFn: (input: GoalInput) => goalsApi.create(workspaceId, input),
    onSuccess: ({ data }) => refresh(data.id),
  })
}

export const useUpdateGoal = (workspaceId: string, goalId: string) => {
  const refresh = useRefreshGoals(workspaceId)
  return useMutation({
    mutationFn: (input: UpdateGoalInput) =>
      goalsApi.update(workspaceId, goalId, input),
    onSuccess: () => refresh(goalId),
  })
}

export const usePauseGoal = (workspaceId: string) => {
  const refresh = useRefreshGoals(workspaceId)
  return useMutation({
    mutationFn: (goalId: string) => goalsApi.pause(workspaceId, goalId),
    onSuccess: ({ data }) => refresh(data.id),
  })
}

export const useResumeGoal = (workspaceId: string) => {
  const refresh = useRefreshGoals(workspaceId)
  return useMutation({
    mutationFn: (goalId: string) => goalsApi.resume(workspaceId, goalId),
    onSuccess: ({ data }) => refresh(data.id),
  })
}

export const useCompleteGoal = (workspaceId: string) => {
  const refresh = useRefreshGoals(workspaceId)
  return useMutation({
    mutationFn: (goalId: string) => goalsApi.complete(workspaceId, goalId),
    onSuccess: ({ data }) => refresh(data.id),
  })
}

export const useArchiveGoal = (workspaceId: string) => {
  const refresh = useRefreshGoals(workspaceId)
  return useMutation({
    mutationFn: (goalId: string) => goalsApi.archive(workspaceId, goalId),
    onSuccess: (_, goalId) => refresh(goalId),
  })
}

export const useRestoreGoal = (workspaceId: string) => {
  const refresh = useRefreshGoals(workspaceId)
  return useMutation({
    mutationFn: (goalId: string) => goalsApi.restore(workspaceId, goalId),
    onSuccess: ({ data }) => refresh(data.id),
  })
}

export const useContributeToGoal = (workspaceId: string, goalId: string) => {
  const refresh = useRefreshGoals(workspaceId)
  return useMutation({
    mutationFn: (input: GoalContributionInput) =>
      goalsApi.contribute(workspaceId, goalId, input),
    onSuccess: () => refresh(goalId),
  })
}

export const useReverseGoalContribution = (
  workspaceId: string,
  goalId: string,
) => {
  const refresh = useRefreshGoals(workspaceId)
  return useMutation({
    mutationFn: (contributionId: string) =>
      goalsApi.reverseContribution(workspaceId, goalId, contributionId),
    onSuccess: () => refresh(goalId),
  })
}
