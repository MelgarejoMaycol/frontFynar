import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { DemoPage } from '@/features/demo'

describe('demo pública', () => {
  it('muestra datos financieros realistas y permite recorrer las secciones', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('scrollTo', vi.fn())

    render(
      <MemoryRouter>
        <DemoPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Demo local')).toBeVisible()
    expect(screen.getByText(/Disponible para usar/)).toBeVisible()
    expect(screen.getByText('Ingresos y egresos')).toBeVisible()
    expect(screen.getByText('Mercado semanal')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Movimientos' }))
    const search = screen.getByPlaceholderText(
      'Buscar por concepto, categoría o cuenta',
    )
    await user.type(search, 'mercado')
    expect(screen.getByText('Mercado semanal')).toBeVisible()
    expect(screen.getByText('Mercado hogar')).toBeVisible()
    expect(screen.queryByText('Pago nómina')).not.toBeInTheDocument()

    await user.clear(search)
    await user.click(screen.getByRole('button', { name: 'Ingresos' }))
    expect(screen.getByText('Pago nómina')).toBeVisible()
    expect(screen.queryByText('Gasolina')).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Presupuestos y metas' }),
    )
    expect(screen.getByText('Fondo de emergencia')).toBeVisible()
    expect(screen.getByText('Alimentación')).toBeVisible()

    await user.click(
      screen.getByRole('button', { name: 'Deudas y préstamos' }),
    )
    expect(screen.getByText('Tarjeta Visa')).toBeVisible()
    expect(screen.getByText('Camila')).toBeVisible()
    expect(screen.getByText('Préstamo a Carlos')).toBeVisible()

    vi.unstubAllGlobals()
  })

  it('usa enlaces de salida reales para reiniciar el flujo normal de sesión', () => {
    render(
      <MemoryRouter>
        <DemoPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Crear mi cuenta' })).toHaveAttribute(
      'href',
      '/register',
    )
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(screen.getByRole('link', { name: 'Salir de la demo' })).toHaveAttribute(
      'href',
      '/',
    )
  })
})
