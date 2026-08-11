import axios from 'axios'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const errorPayload = (value: unknown) => {
  if (!isRecord(value) || value.success !== false || !isRecord(value.error))
    return null
  return value.error
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown
  readonly requestId: string | undefined

  constructor(
    message: string,
    status: number,
    code: string,
    details: unknown = null,
    requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (!axios.isAxiosError(error)) {
    return new ApiError('Ocurrió un error inesperado', 0, 'UNEXPECTED_ERROR')
  }
  if (!error.response) {
    return new ApiError(
      'No fue posible conectar con el servidor',
      0,
      'NETWORK_ERROR',
    )
  }

  const payload = errorPayload(error.response.data)
  const message =
    typeof payload?.message === 'string'
      ? payload.message
      : 'La solicitud falló'
  const code = typeof payload?.code === 'string' ? payload.code : 'HTTP_ERROR'
  const requestIdHeader = error.response.headers['x-request-id']
  const requestId =
    typeof requestIdHeader === 'string' ? requestIdHeader : undefined

  return new ApiError(
    message,
    error.response.status,
    code,
    payload?.details ?? null,
    requestId,
  )
}
