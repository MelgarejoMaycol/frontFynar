import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  Goal,
  GoalContributionInput,
  GoalFilters,
  GoalInput,
  GoalList,
  GoalProjection,
  UpdateGoalInput,
} from '../types/goal.types'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/goals`

const query = (filters: GoalFilters) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}

const postAction = (workspaceId: string, goalId: string, action: string) =>
  httpClient.post<ApiSuccess<Goal>, undefined>(
    `${base(workspaceId)}/${goalId}/${action}`,
    undefined,
  )

export const goalsApi = {
  list: (workspaceId: string, filters: GoalFilters, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<GoalList>>(
      `${base(workspaceId)}${query(filters)}`,
      signal,
    ),
  get: (workspaceId: string, goalId: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<Goal>>(
      `${base(workspaceId)}/${goalId}`,
      signal,
    ),
  projection: (
    workspaceId: string,
    goalId: string,
    signal?: AbortSignal,
  ) =>
    httpClient.get<ApiSuccess<GoalProjection>>(
      `${base(workspaceId)}/${goalId}/projection`,
      signal,
    ),
  create: (workspaceId: string, input: GoalInput) =>
    httpClient.post<ApiSuccess<Goal>, GoalInput>(base(workspaceId), input),
  update: (workspaceId: string, goalId: string, input: UpdateGoalInput) =>
    httpClient.patch<ApiSuccess<Goal>, UpdateGoalInput>(
      `${base(workspaceId)}/${goalId}`,
      input,
    ),
  archive: (workspaceId: string, goalId: string) =>
    httpClient.delete<ApiSuccess<{ mode: 'LOGICAL' }>>(
      `${base(workspaceId)}/${goalId}`,
    ),
  restore: (workspaceId: string, goalId: string) =>
    postAction(workspaceId, goalId, 'restore'),
  pause: (workspaceId: string, goalId: string) =>
    postAction(workspaceId, goalId, 'pause'),
  resume: (workspaceId: string, goalId: string) =>
    postAction(workspaceId, goalId, 'resume'),
  complete: (workspaceId: string, goalId: string) =>
    postAction(workspaceId, goalId, 'complete'),
  contribute: (
    workspaceId: string,
    goalId: string,
    input: GoalContributionInput,
  ) =>
    httpClient.post<ApiSuccess<Goal>, GoalContributionInput>(
      `${base(workspaceId)}/${goalId}/contributions`,
      input,
    ),
  reverseContribution: (
    workspaceId: string,
    goalId: string,
    contributionId: string,
  ) =>
    httpClient.post<ApiSuccess<Goal>, undefined>(
      `${base(workspaceId)}/${goalId}/contributions/${contributionId}/reverse`,
      undefined,
    ),
}
