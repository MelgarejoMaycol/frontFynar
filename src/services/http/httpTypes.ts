export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: unknown
}

export interface ApiFailure {
  success: false
  error: {
    code: string
    message: string
    details: unknown
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface HttpRequestOptions<TBody = unknown> {
  method?: HttpMethod
  body?: TBody
  headers?: Record<string, string>
  signal?: AbortSignal
}
