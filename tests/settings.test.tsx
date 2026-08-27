import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, httpClient } from '@/services/http'
import { authMeKey } from '@/features/auth/hooks/auth.hooks'
import type { AuthUser } from '@/features/auth/types/auth.types'
import { settingsApi } from '@/features/settings/api/settings.api'
import { ProfileForm } from '@/features/settings/components/ProfileForm'
import { PreferencesForm } from '@/features/settings/components/PreferencesForm'
import { useUpdateProfile } from '@/features/settings/hooks/settings.hooks'
import { getSettingsErrorMessage } from '@/features/settings/settings.errors'
import { workspaceApi } from '@/features/workspace/api/workspace.api'
import {
  useUpdatePreferences,
  workspaceKeys,
} from '@/features/workspace/hooks/workspace.hooks'
import { applyTheme } from '@/features/workspace/theme'
import type { UserPreferences } from '@/features/workspace/types/workspace.types'

const user: AuthUser = {
  id: 'u',
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'Vega',
  phone: '+57 3000000000',
  avatarUrl: null,
  isEmailVerified: true,
  isActive: true,
  createdAt: 'x',
  updatedAt: 'x',
}
const preferences: UserPreferences = {
  defaultWorkspaceId: null,
  language: 'es-CO',
  currency: 'COP',
  timezone: 'America/Bogota',
  dateFormat: 'DD/MM/YYYY',
  theme: 'SYSTEM',
  startScreen: 'DASHBOARD',
  financialCycleStartDay: null,
  dashboardLayout: {},
  createdAt: 'x',
  updatedAt: 'x',
}
const provider =
  (client: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )

describe('settings', () => {
  it('usa endpoints reales de perfil y preferencias', async () => {
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValue({ success: true, data: user })
    const patch = vi
      .spyOn(httpClient, 'patch')
      .mockResolvedValue({ success: true, data: user })
    await settingsApi.getProfile()
    await settingsApi.updateProfile({ firstName: 'María' })
    await workspaceApi.getPreferences()
    await workspaceApi.updatePreferences({ theme: 'DARK' })
    expect(get).toHaveBeenCalledWith('/users/me', undefined)
    expect(get).toHaveBeenCalledWith('/users/me/preferences', undefined)
    expect(patch).toHaveBeenCalledWith(
      '/users/me',
      { firstName: 'María' },
      undefined,
    )
    expect(patch).toHaveBeenCalledWith(
      '/users/me/preferences',
      { theme: 'DARK' },
      undefined,
    )
  })
  it('edita nombre, apellido y teléfono; email es solo lectura', async () => {
    const submit = vi.fn()
    render(
      <ProfileForm
        user={user}
        pending={false}
        error={null}
        onSubmit={submit}
      />,
    )
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute(
      'readonly',
    )
    fireEvent.change(screen.getByLabelText(/^Nombre/), {
      target: { value: 'María' },
    })
    fireEvent.change(screen.getByLabelText('Apellido'), {
      target: { value: 'López' },
    })
    fireEvent.change(screen.getByLabelText('Teléfono'), {
      target: { value: '+57 3111111111' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar perfil' }))
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'María',
          lastName: 'López',
          phone: '+57 3111111111',
        }),
      ),
    )
  })
  it('bloquea doble submit y oculta errores internos', () => {
    render(
      <ProfileForm
        user={user}
        pending
        error={new ApiError('Prisma secret', 500, 'INTERNAL')}
        onSubmit={vi.fn()}
      />,
    )
    expect(document.querySelector('button[type="submit"]')).toBeDisabled()
    expect(screen.getByRole('alert')).not.toHaveTextContent('Prisma')
    expect(
      getSettingsErrorMessage(new ApiError('SQL', 409, 'CONFLICT')),
    ).not.toContain('SQL')
  })
  it('edita tema, moneda, timezone, idioma y formato', async () => {
    const submit = vi.fn()
    render(
      <PreferencesForm
        preferences={preferences}
        pending={false}
        error={null}
        onSubmit={submit}
      />,
    )
    fireEvent.change(screen.getByLabelText('Tema'), {
      target: { value: 'DARK' },
    })
    fireEvent.change(screen.getByLabelText('Moneda preferida'), {
      target: { value: 'USD' },
    })
    fireEvent.change(screen.getByLabelText('Zona horaria'), {
      target: { value: 'UTC' },
    })
    fireEvent.change(screen.getByLabelText('Idioma'), {
      target: { value: 'es-CO' },
    })
    fireEvent.change(screen.getByLabelText('Formato de fecha'), {
      target: { value: 'YYYY-MM-DD' },
    })
    fireEvent.change(screen.getByLabelText('Inicio del ciclo financiero'), {
      target: { value: '25' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Guardar preferencias' }),
    )
    await waitFor(() => expect(submit).toHaveBeenCalled())
    expect(submit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        theme: 'DARK',
        currency: 'USD',
        timezone: 'UTC',
        language: 'es-CO',
        dateFormat: 'YYYY-MM-DD',
        financialCycleStartDay: 25,
      }),
    )
  })
  it('actualiza auth/me para que Header cambie sin F5', async () => {
    vi.spyOn(settingsApi, 'updateProfile').mockResolvedValue({
      success: true,
      data: { ...user, firstName: 'María' },
    })
    const client = new QueryClient(),
      { result } = renderHook(() => useUpdateProfile(), {
        wrapper: provider(client),
      })
    await result.current.mutateAsync({ firstName: 'María' })
    expect(client.getQueryData<AuthUser>(authMeKey)?.firstName).toBe('María')
  })
  it('persiste preferencias en caché y aplica tema', async () => {
    vi.spyOn(workspaceApi, 'updatePreferences').mockResolvedValue({
      success: true,
      data: { ...preferences, theme: 'DARK' },
    })
    const client = new QueryClient(),
      { result } = renderHook(() => useUpdatePreferences(), {
        wrapper: provider(client),
      })
    await result.current.mutateAsync({ theme: 'DARK' })
    expect(
      client.getQueryData<UserPreferences>(workspaceKeys.preferences)?.theme,
    ).toBe('DARK')
    expect(document.documentElement.dataset.bsTheme).toBe('dark')
    applyTheme('LIGHT')
    expect(document.documentElement.dataset.bsTheme).toBe('light')
  })
})
