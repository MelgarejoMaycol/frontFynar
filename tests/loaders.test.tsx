import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button, Spinner } from '@/components/ui'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'

describe('estados de carga globales', () => {
  it('muestra un spinner global con contexto y lo retira al resolver', () => {
    const view = render(<PageLoader />)
    expect(
      screen.getByRole('status', { name: 'Cargando página' }),
    ).toBeVisible()
    expect(screen.getByText('Cargando…')).toBeVisible()
    view.rerender(<p>Contenido listo</p>)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Contenido listo')).toBeVisible()
  })

  it('un error reemplaza al loader', () => {
    const view = render(<PageLoader />)
    view.rerender(
      <ErrorState title="No pudimos cargar" message="Inténtalo nuevamente." />,
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('No pudimos cargar')).toBeVisible()
  })

  it('el botón pendiente mantiene texto, spinner y bloquea doble envío', async () => {
    const action = vi.fn()
    const user = userEvent.setup()
    render(
      <Button loading onClick={action}>
        Guardar
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Guardar' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    await user.dblClick(button)
    expect(action).not.toHaveBeenCalled()
  })

  it('ofrece tamaños consistentes desde una sola estructura', () => {
    render(
      <>
        <Spinner size="small" label="Carga breve" />
        <Spinner size="large" label="Carga extensa" />
      </>,
    )
    expect(
      screen.getByRole('status', { name: 'Carga breve' }).className,
    ).toContain('spinner')
    expect(
      screen.getByRole('status', { name: 'Carga extensa' }).className,
    ).toContain('spinner')
  })
})
