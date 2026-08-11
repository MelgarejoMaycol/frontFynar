import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, subscribeTheme } from '@/features/workspace/theme'
import { resolveStartScreen } from '@/features/workspace/start-screen'
import { safeInternalRedirect } from '@/features/auth/redirect'

describe('cierre fase 10', () => {
  const original = window.matchMedia
  afterEach(() => {
    window.matchMedia = original
    vi.restoreAllMocks()
  })
  const media = (dark: boolean) => {
    let listener: (() => void) | undefined
    const value = {
      matches: dark,
      addEventListener: vi.fn((_name: string, next: () => void) => {
        listener = next
      }),
      removeEventListener: vi.fn(),
    }
    window.matchMedia = vi.fn(() => value as unknown as MediaQueryList)
    return { value, change: () => listener?.() }
  }
  it('LIGHT y DARK no escuchan cambios del sistema', () => {
    const mock = media(true)
    const cleanLight = subscribeTheme('LIGHT')
    expect(document.documentElement.dataset.bsTheme).toBe('light')
    const cleanDark = subscribeTheme('DARK')
    expect(document.documentElement.dataset.bsTheme).toBe('dark')
    expect(mock.value.addEventListener).not.toHaveBeenCalled()
    cleanLight()
    cleanDark()
  })
  it('SYSTEM sigue el sistema y cambia en vivo', () => {
    const mock = media(false)
    const cleanup = subscribeTheme('SYSTEM')
    expect(document.documentElement.dataset.bsTheme).toBe('light')
    mock.value.matches = true
    mock.change()
    expect(document.documentElement.dataset.bsTheme).toBe('dark')
    cleanup()
    expect(mock.value.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    )
  })
  it('applyTheme explícito permanece centralizado', () => {
    media(false)
    applyTheme('DARK')
    expect(document.documentElement.dataset.bsTheme).toBe('dark')
  })
  it.each([
    ['DASHBOARD', '/app/dashboard'],
    ['TRANSACTIONS', '/app/transactions'],
    ['BUDGETS', '/app/budgets'],
    ['DEBTS', '/app/dashboard'],
    ['FUTURE', '/app/dashboard'],
  ])('resuelve startScreen %s', (preference, expected) => {
    expect(resolveStartScreen(preference)).toBe(expected)
  })
  it('conserva rutas privadas explícitas y solo usa /app como entrada inicial', () => {
    expect(safeInternalRedirect('/app/transactions')).toBe('/app/transactions')
    expect(safeInternalRedirect(undefined)).toBe('/app')
  })
})
