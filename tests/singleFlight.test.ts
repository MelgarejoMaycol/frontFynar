import { describe, expect, it, vi } from 'vitest'
import { createSingleFlight } from '@/services/http/singleFlight'

describe('coordinador de refresh', () => {
  it('comparte una sola operación entre solicitudes concurrentes', async () => {
    const operation = vi.fn(async () => 'access-token')
    const run = createSingleFlight<string>()

    const [first, second] = await Promise.all([run(operation), run(operation)])

    expect(operation).toHaveBeenCalledTimes(1)
    expect(first).toBe('access-token')
    expect(second).toBe('access-token')
  })

  it('libera el coordinador después de un refresh fallido', async () => {
    const run = createSingleFlight<string>()
    const failure = new Error('refresh rechazado')

    await expect(run(async () => Promise.reject(failure))).rejects.toBe(failure)
    await expect(run(async () => 'nuevo-token')).resolves.toBe('nuevo-token')
  })
})
