import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '@/features/auth/api/auth.api'
import { getAuthErrorMessage } from '@/features/auth/auth.errors'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import {
  ProtectedRoute,
  PublicOnlyRoute,
} from '@/features/auth/components/route-guards'
import { SessionInitializer } from '@/features/auth/components/SessionInitializer'
import { safeInternalRedirect } from '@/features/auth/redirect'
import {
  loginSchema,
  registerSchema,
} from '@/features/auth/schemas/auth.schemas'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ApiError } from '@/services/http/httpErrors'

const provider = (children: React.ReactNode) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => useAuthStore.getState().clearSession())
afterEach(() => vi.restoreAllMocks())

describe('autenticación', () => {
  it('mantiene solo el access token en memoria', () => {
    useAuthStore.getState().setAccessToken('access')
    expect(useAuthStore.getState().accessToken).toBe('access')
    expect('refreshToken' in useAuthStore.getState()).toBe(false)
    expect(localStorage).toHaveLength(0)
    expect(sessionStorage).toHaveLength(0)
  })
  it('valida login y normaliza el correo', () => {
    expect(
      loginSchema.parse({ email: '  USER@Example.COM ', password: 'secret' })
        .email,
    ).toBe('user@example.com')
    expect(
      loginSchema.safeParse({ email: 'incorrecto', password: '' }).success,
    ).toBe(false)
  })
  it('aplica las reglas reales de registro y rechaza contraseñas distintas', () => {
    expect(
      registerSchema.safeParse({
        firstName: 'Ana',
        lastName: 'Vega',
        email: 'ana@example.com',
        password: '1234567890',
        confirmPassword: '1234567891',
      }).success,
    ).toBe(false)
    expect(
      registerSchema.safeParse({
        firstName: 'Ana',
        lastName: 'Vega',
        email: 'ana@example.com',
        password: '1234567890',
        confirmPassword: '1234567890',
      }).success,
    ).toBe(true)
  })
  it('muestra errores accesibles en el formulario de login', async () => {
    const user = userEvent.setup()
    render(
      provider(
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>,
      ),
    )
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findAllByRole('alert')).toHaveLength(2)
  })
  it('muestra el error de confirmación del registro', async () => {
    const user = userEvent.setup()
    render(
      provider(
        <MemoryRouter>
          <RegisterForm />
        </MemoryRouter>,
      ),
    )
    await user.type(screen.getByRole('textbox', { name: /Nombre/ }), 'Ana')
    await user.type(screen.getByRole('textbox', { name: /Apellido/ }), 'Vega')
    await user.type(screen.getByLabelText(/Correo/), 'ana@example.com')
    await user.type(screen.getByLabelText(/^Contrase/), '1234567890')
    await user.type(screen.getByLabelText(/Confirmar/), '1234567891')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(
      await screen.findByText('Las contraseñas no coinciden'),
    ).toHaveAttribute('role', 'alert')
  })
  it('crea la sesión y navega al dashboard cuando el registro devuelve tokens', async () => {
    const registerRequest = vi.spyOn(authApi, 'register').mockResolvedValue({
      success: true,
      data: {
        user: {
          id: 'user-1',
          email: 'ana@example.com',
          firstName: 'Ana',
          lastName: 'Vega',
          phone: null,
          avatarUrl: null,
          isEmailVerified: false,
          isActive: true,
          createdAt: '2026-08-06T00:00:00.000Z',
          updatedAt: '2026-08-06T00:00:00.000Z',
        },
        tokens: {
          accessToken: 'access-token',
          accessTokenExpiresInSeconds: 900,
        },
      },
    })
    const user = userEvent.setup()

    render(
      provider(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/app/dashboard" element={<p>Dashboard</p>} />
          </Routes>
        </MemoryRouter>,
      ),
    )
    await user.type(screen.getByRole('textbox', { name: /Nombre/ }), 'Ana')
    await user.type(screen.getByRole('textbox', { name: /Apellido/ }), 'Vega')
    await user.type(screen.getByLabelText(/Correo/), 'ana@example.com')
    await user.type(screen.getByLabelText(/^Contrase/), '1234567890')
    await user.type(screen.getByLabelText(/Confirmar/), '1234567890')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('Dashboard')).toBeVisible()
    expect(registerRequest).toHaveBeenCalledWith({
      firstName: 'Ana',
      lastName: 'Vega',
      email: 'ana@example.com',
      password: '1234567890',
    })
    expect(useAuthStore.getState().status).toBe('authenticated')
  })
  it('protege rutas privadas y conserva el destino', () => {
    render(
      <MemoryRouter initialEntries={['/app/accounts?view=all']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/app/accounts" element={<p>Privado</p>} />
          </Route>
          <Route path="/login" element={<p>Login</p>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Login')).toBeVisible()
  })
  it('redirige rutas públicas cuando existe sesión', () => {
    useAuthStore.getState().setStatus('authenticated')
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<p>Login</p>} />
          </Route>
          <Route path="/app" element={<p>Inicio privado</p>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Inicio privado')).toBeVisible()
  })
  it('solo permite redirecciones internas seguras', () => {
    expect(safeInternalRedirect('/app/accounts')).toBe('/app/accounts')
    expect(safeInternalRedirect('https://evil.example')).toBe('/app')
    expect(safeInternalRedirect('//evil.example')).toBe('/app')
  })
  it('traduce credenciales inválidas y correos duplicados sin filtrar detalles', () => {
    expect(
      getAuthErrorMessage(
        new ApiError('detalle interno', 401, 'UNAUTHORIZED'),
        'login',
      ),
    ).toBe('Correo o contraseña incorrectos.')
    expect(
      getAuthErrorMessage(
        new ApiError('detalle interno', 409, 'CONFLICT'),
        'register',
      ),
    ).toBe('Ya existe una cuenta asociada a ese correo.')
  })
  it('resuelve como no autenticada una carga cuando la cookie no permite refresh', async () => {
    useAuthStore.getState().setStatus('checking')
    render(
      provider(
        <SessionInitializer refresh={() => Promise.reject(new Error('401'))}>
          <p>Aplicación</p>
        </SessionInitializer>,
      ),
    )
    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe('unauthenticated'),
    )
  })
  it('restaura la sesión mediante refresh y usuario actual', async () => {
    useAuthStore.getState().setStatus('checking')
    const user = {
      id: 'user-1',
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Vega',
      phone: null,
      avatarUrl: null,
      isEmailVerified: true,
      isActive: true,
      createdAt: '2026-08-06T00:00:00.000Z',
      updatedAt: '2026-08-06T00:00:00.000Z',
    }
    render(
      provider(
        <SessionInitializer
          refresh={async () => {
            useAuthStore.getState().setAccessToken('access')
            return 'access'
          }}
          loadUser={async () => ({ success: true, data: user })}
        >
          <p>Aplicación</p>
        </SessionInitializer>,
      ),
    )
    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe('authenticated'),
    )
    expect(useAuthStore.getState().accessToken).toBe('access')
  })
})
