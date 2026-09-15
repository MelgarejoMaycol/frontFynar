import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { toApiError } from '@/services/http/httpErrors'

describe('errores HTTP', () => {
  it('conserva status, código, detalles y requestId del backend', () => {
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos inválidos',
            details: ['campo'],
          },
        },
        status: 400,
        statusText: 'Bad Request',
        headers: new AxiosHeaders({ 'x-request-id': 'request-123' }),
        config: { headers: new AxiosHeaders() },
      },
    )

    expect(toApiError(error)).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Datos inválidos',
      details: ['campo'],
      requestId: 'request-123',
    })
  })

  it('transforma fallos de red sin exponer detalles técnicos', () => {
    const error = toApiError(new AxiosError('socket details'))
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
    expect(error.message).toBe('No pudimos completar la solicitud en este momento')
  })

  it('distingue una respuesta lenta de una caída de red', () => {
    const error = toApiError(
      new AxiosError('timeout of 45000ms exceeded', 'ECONNABORTED'),
    )
    expect(error).toMatchObject({ status: 0, code: 'REQUEST_TIMEOUT' })
    expect(error.message).toContain('tardando')
    expect(error.message).not.toContain('conexión')
  })
})
