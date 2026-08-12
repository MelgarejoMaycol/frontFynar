import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '@/features/auth/api/auth.api'
import { VerifyEmailPage } from '@/features/auth/pages/VerificationPages'
import { ApiError } from '@/services/http/httpErrors'

function renderPage(entry: string) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <VerifyEmailPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => vi.restoreAllMocks())

describe('verificación de correo', () => {
  it('confirma la verificación y ofrece iniciar sesión', async () => {
    vi.spyOn(authApi, 'verifyEmail').mockResolvedValue(undefined)
    renderPage('/verify-email?token=valid-token')

    expect(
      await screen.findByRole('heading', { name: 'Correo verificado' }),
    ).toBeVisible()
    expect(
      screen.getByText(
        'Tu correo está verificado. Inicia sesión para continuar.',
      ),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible()
  })

  it('trata un token ya utilizado como un correo ya verificado', async () => {
    vi.spyOn(authApi, 'verifyEmail').mockRejectedValue(
      new ApiError('Token utilizado', 409, 'VERIFICATION_TOKEN_USED'),
    )
    renderPage('/verify-email?token=used-token')

    expect(
      await screen.findByRole('heading', { name: 'Correo verificado' }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible()
  })

  it('no intenta verificar un enlace sin token', () => {
    const verify = vi.spyOn(authApi, 'verifyEmail')
    renderPage('/verify-email')

    expect(
      screen.getByText('El enlace de verificación está incompleto.'),
    ).toBeVisible()
    expect(verify).not.toHaveBeenCalled()
  })
})
