import axios from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '@/features/auth/api/auth.api'
import {
  AUTH_ROUTES,
  isRefreshExcludedRoute,
} from '@/features/auth/auth.routes'
import { httpClient } from '@/services/http/httpClient'

afterEach(() => vi.restoreAllMocks())

describe('rutas de autenticación', () => {
  it('usa rutas relativas a la raíz versionada para todas las operaciones principales', () => {
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue(undefined)
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue(undefined)

    void authApi.register({
      firstName: 'Ana',
      lastName: 'Vega',
      email: 'ana@example.com',
      password: '1234567890',
    })
    void authApi.login({ email: 'ana@example.com', password: '1234567890' })
    void authApi.refresh()
    void authApi.logout()
    void authApi.getCurrentUser()

    expect(post.mock.calls.map(([path]) => path)).toEqual([
      '/auth/register',
      '/auth/login',
      '/auth/refresh',
      '/auth/logout',
    ])
    expect(get).toHaveBeenCalledWith('/auth/me', undefined)
    expect(post.mock.calls[2]?.[1]).toBeUndefined()
    expect(post.mock.calls[3]?.[1]).toBeUndefined()
  })

  it('combina el baseURL real sin repetir /api/v1', () => {
    const resolved = axios.getUri({
      baseURL: 'http://localhost:3000/api/v1',
      url: AUTH_ROUTES.register,
    })

    expect(resolved).toBe('http://localhost:3000/api/v1/auth/register')
    expect(resolved).not.toContain('/api/v1/api/v1')
  })

  it('excluye exactamente los endpoints que no deben disparar refresh', () => {
    expect(isRefreshExcludedRoute('/auth/login')).toBe(true)
    expect(isRefreshExcludedRoute('/auth/register')).toBe(true)
    expect(isRefreshExcludedRoute('/auth/refresh')).toBe(true)
    expect(isRefreshExcludedRoute('/auth/logout')).toBe(true)
    expect(isRefreshExcludedRoute('/auth/logout-all')).toBe(true)
    expect(isRefreshExcludedRoute('/auth/login?source=web')).toBe(true)
    expect(isRefreshExcludedRoute('/auth/me')).toBe(false)
    expect(isRefreshExcludedRoute('/auth/logout-history')).toBe(false)
  })
})
