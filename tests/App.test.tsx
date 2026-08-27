import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '@/app/router/AppRouter'
import { ToastProvider } from '@/components/feedback/ToastProvider'
import { authMeKey, useAuthStore, type AuthUser } from '@/features/auth'
import { authApi } from '@/features/auth/api/auth.api'
import { accountsKeys } from '@/features/accounts'
import { categoriesKeys } from '@/features/categories'
import {
  useWorkspaceStore,
  workspaceKeys,
  type UserPreferences,
  type Workspace,
} from '@/features/workspace'
import { workspaceApi } from '@/features/workspace/api/workspace.api'

const testUser: AuthUser = {
  id: 'user-1',
  email: 'user@example.com',
  firstName: 'Ana',
  lastName: 'Vega',
  phone: null,
  avatarUrl: null,
  isEmailVerified: false,
  isActive: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}
const testWorkspace: Workspace = {
  id: 'workspace-1',
  name: 'Espacio de Ana',
  type: 'PERSONAL',
  baseCurrency: 'COP',
  timezone: 'America/Bogota',
  isActive: true,
  role: 'OWNER',
  membershipStatus: 'ACTIVE',
  permissions: ['accounts.read'],
  isDefault: true,
}
const testPreferences: UserPreferences = {
  defaultWorkspaceId: testWorkspace.id,
  language: 'es-CO',
  currency: 'COP',
  timezone: 'America/Bogota',
  dateFormat: 'DD/MM/YYYY',
  theme: 'SYSTEM',
  startScreen: 'DASHBOARD',
  dashboardLayout: {},
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

afterEach(() => vi.restoreAllMocks())

function renderRoute(
  path: string,
  seed: { profile?: boolean; preferences?: boolean; workspaces?: boolean } = {},
) {
  const isPrivate = path.startsWith('/app')
  useAuthStore.getState().clearSession()
  useWorkspaceStore.getState().clearWorkspace()
  useAuthStore
    .getState()
    .setStatus(isPrivate ? 'authenticated' : 'unauthenticated')
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  if (isPrivate) {
    if (seed.profile !== false) queryClient.setQueryData(authMeKey, testUser)
    if (seed.workspaces !== false)
      queryClient.setQueryData(workspaceKeys.all, [testWorkspace])
    if (seed.preferences !== false)
      queryClient.setQueryData(workspaceKeys.preferences, testPreferences)
    queryClient.setQueryData(
      accountsKeys.list(testWorkspace.id, false, 'all', true),
      [],
    )
    queryClient.setQueryData(categoriesKeys.all(testWorkspace.id), [])
  }
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('navegación y layouts', () => {
  it('redirige la raíz al acceso público y renderiza AuthLayout', async () => {
    renderRoute('/')
    expect(
      await screen.findByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Navegación de acceso')).toBeVisible()
    expect(
      screen.getByLabelText('Navegación de acceso').closest('[data-bs-theme]'),
    ).toHaveAttribute('data-bs-theme', 'light')
  })
  it('navega entre rutas públicas', async () => {
    const user = userEvent.setup()
    renderRoute('/login')
    await user.click(screen.getByRole('link', { name: 'Crear cuenta' }))
    expect(
      await screen.findByRole('heading', { name: 'Crear cuenta' }),
    ).toBeVisible()
  })
  it('renderiza AppLayout sin fingir autenticación', async () => {
    const user = userEvent.setup()
    renderRoute('/app/dashboard')
    await user.click(
      screen.getByRole('button', { name: 'Abrir menú principal' }),
    )
    expect(
      screen.getByRole('navigation', { name: 'Navegación principal' }),
    ).toBeInTheDocument()
    const header = within(
      screen.getByRole('banner', { name: 'Encabezado de aplicación' }),
    )
    expect(header.getByText('Inicio')).toBeInTheDocument()
    expect(header.queryByText('Espacio de Ana')).not.toBeInTheDocument()
  })
  it('navega entre secciones privadas simuladas', async () => {
    const user = userEvent.setup()
    renderRoute('/app/dashboard')
    await user.click(
      screen.getByRole('button', { name: 'Abrir menú principal' }),
    )
    await user.click(screen.getByRole('link', { name: 'Cuentas' }))
    expect(
      await screen.findByRole('heading', { name: 'Cuentas', level: 1 }),
    ).toBeVisible()
  })
  it('marca el elemento activo del sidebar', async () => {
    const user = userEvent.setup()
    renderRoute('/app/categories')
    await user.click(
      screen.getByRole('button', { name: 'Abrir menú principal' }),
    )
    expect(screen.getByRole('link', { name: 'Categorías' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
  it('abre y cierra el menú móvil', async () => {
    const user = userEvent.setup()
    renderRoute('/app/dashboard')
    const open = screen.getByRole('button', { name: 'Abrir menú principal' })
    expect(open).toHaveAttribute('aria-expanded', 'false')
    await user.click(open)
    expect(open).toHaveAttribute('aria-expanded', 'true')
    await user.click(
      screen.getAllByRole('button', { name: 'Cerrar menú principal' })[0]!,
    )
    expect(open).toHaveAttribute('aria-expanded', 'false')
  })
  it('cierra el drawer al navegar y restaura el scroll', async () => {
    const user = userEvent.setup()
    renderRoute('/app/dashboard')
    const open = screen.getByRole('button', { name: 'Abrir menú principal' })
    await user.click(open)
    expect(document.body.style.overflow).toBe('hidden')
    await user.click(screen.getByRole('link', { name: 'Cuentas' }))
    expect(open).toHaveAttribute('aria-expanded', 'false')
    expect(document.body.style.overflow).toBe('')
  })
  it('cierra el drawer con Escape y devuelve el foco', async () => {
    const user = userEvent.setup()
    renderRoute('/app/dashboard')
    const open = screen.getByRole('button', { name: 'Abrir menú principal' })
    await user.click(open)
    await user.keyboard('{Escape}')
    expect(open).toHaveAttribute('aria-expanded', 'false')
    expect(open).toHaveFocus()
  })
  it('resuelve el título del header desde la configuración de navegación', () => {
    renderRoute('/app/transactions')
    expect(
      within(
        screen.getByRole('banner', { name: 'Encabezado de aplicación' }),
      ).getByText('Movimientos'),
    ).toBeVisible()
  })
  it('abre Configuración desde el menú y muestra solo datos reales de la cuenta', async () => {
    const user = userEvent.setup()
    renderRoute('/app/dashboard')
    await user.click(screen.getByLabelText('Menú de cuenta'))
    await user.click(screen.getByRole('link', { name: 'Configuración' }))
    expect(
      await screen.findByRole('heading', { name: 'Configuración' }),
    ).toBeVisible()
    expect(screen.getByLabelText(/^Nombre/)).toHaveValue('Ana')
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue(
      'user@example.com',
    )
    expect(screen.getByText('Espacio de Ana', { selector: 'dd' })).toBeVisible()
    expect(screen.getByText('Propietario')).toBeVisible()
  })
  it('mantiene perfil y seguridad si fallan las preferencias', async () => {
    vi.spyOn(workspaceApi, 'getPreferences').mockRejectedValue(
      new Error('preferences unavailable'),
    )
    renderRoute('/app/settings', { preferences: false })
    expect(await screen.findByLabelText(/^Nombre/)).toHaveValue('Ana')
    expect(
      await screen.findByRole('heading', {
        name: 'No pudimos consultar las preferencias',
      }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Seguridad' })).toBeVisible()
  })
  it('mantiene perfil y preferencias si falla el workspace', async () => {
    vi.spyOn(workspaceApi, 'list').mockRejectedValue(
      new Error('workspace unavailable'),
    )
    renderRoute('/app/settings', { workspaces: false })
    expect(await screen.findByLabelText(/^Nombre/)).toHaveValue('Ana')
    expect(screen.getByLabelText('Tema')).toHaveValue('SYSTEM')
    expect(
      await screen.findByRole('heading', {
        name: 'No pudimos consultar el espacio financiero',
      }),
    ).toBeVisible()
  })
  it('confirma logout all, limpia la sesión y vuelve al login', async () => {
    vi.spyOn(authApi, 'logoutAll').mockResolvedValue(undefined)
    useWorkspaceStore.getState().setActiveWorkspaceId(testWorkspace.id)
    const user = userEvent.setup()
    renderRoute('/app/settings')
    await user.click(
      await screen.findByRole('button', { name: 'Cerrar todas' }),
    )
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Esto cerrará tu sesión en todos los dispositivos',
    )
    await user.click(screen.getByRole('button', { name: 'Confirmar cierre' }))
    expect(
      await screen.findByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeVisible()
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBeNull()
  })
  it('cierra la sesión desde el header mediante el servicio compartido', async () => {
    const logout = vi.spyOn(authApi, 'logout').mockResolvedValue(undefined)
    useWorkspaceStore.getState().setActiveWorkspaceId(testWorkspace.id)
    const user = userEvent.setup()
    renderRoute('/app/dashboard')
    await user.click(screen.getByLabelText('Menú de cuenta'))
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(
      await screen.findByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeVisible()
    expect(logout).toHaveBeenCalledWith()
    expect(useAuthStore.getState().status).toBe('unauthenticated')
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBeNull()
  })
  it('muestra una página 404 útil', () => {
    renderRoute('/ruta-inexistente')
    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' }),
    ).toBeVisible()
    expect(
      screen.getByRole('link', { name: 'Volver al inicio' }),
    ).toHaveAttribute('href', '/login')
  })
})
