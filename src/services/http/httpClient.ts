import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { env } from '@/config/env'
import { invalidateClientSession } from '@/features/auth/session-events'
import {
  AUTH_ROUTES,
  isRefreshExcludedRoute,
} from '@/features/auth/auth.routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { ApiSuccess } from './httpTypes'
import type { AuthTokens } from '@/features/auth/types/auth.types'
import { toApiError } from './httpErrors'
import type { HttpRequestOptions } from './httpTypes'
import { createSingleFlight } from './singleFlight'

const client = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
})

interface RetryableConfig extends InternalAxiosRequestConfig {
  _authRetried?: boolean
}
const runRefresh = createSingleFlight<string>()

export const refreshAccessToken = (): Promise<string> =>
  runRefresh(() =>
    client
      .post<ApiSuccess<AuthTokens>>(AUTH_ROUTES.refresh)
      .then(({ data }) => {
        useAuthStore.getState().setAccessToken(data.data.accessToken)
        return data.data.accessToken
      })
      .catch((refreshError: unknown) => {
        useAuthStore.getState().clearSession()
        invalidateClientSession()
        throw refreshError
      }),
  )

client.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

client.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetryableConfig | undefined
  const path = config?.url ?? ''
  const canRefresh =
    error.response?.status === 401 &&
    config &&
    !config._authRetried &&
    !isRefreshExcludedRoute(path)
  if (!canRefresh) return Promise.reject(error)
  config._authRetried = true
  const accessToken = await refreshAccessToken()
  config.headers.Authorization = `Bearer ${accessToken}`
  return client.request(config)
})

async function request<TResponse, TBody = unknown>(
  path: string,
  options: HttpRequestOptions<TBody> = {},
): Promise<TResponse> {
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData
  const config: AxiosRequestConfig<TBody> = {
    url: path,
    method: options.method ?? 'GET',
    signal: options.signal,
    headers: {
      ...(options.body === undefined || isFormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    ...(options.body === undefined ? {} : { data: options.body }),
  }

  try {
    const response = await client.request<TResponse>(config)
    return response.data
  } catch (error: unknown) {
    throw toApiError(error)
  }
}

export const httpClient = {
  request,
  get: <TResponse>(path: string, signal?: AbortSignal) =>
    request<TResponse>(path, { method: 'GET', signal }),
  post: <TResponse, TBody>(path: string, body: TBody, signal?: AbortSignal) =>
    request<TResponse, TBody>(path, { method: 'POST', body, signal }),
  put: <TResponse, TBody>(path: string, body: TBody, signal?: AbortSignal) =>
    request<TResponse, TBody>(path, { method: 'PUT', body, signal }),
  patch: <TResponse, TBody>(path: string, body: TBody, signal?: AbortSignal) =>
    request<TResponse, TBody>(path, { method: 'PATCH', body, signal }),
  delete: <TResponse, TBody = undefined>(
    path: string,
    body?: TBody,
    signal?: AbortSignal,
  ) => request<TResponse, TBody>(path, { method: 'DELETE', body, signal }),
}
