import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  Button,
  FormField,
  HorizontalScrollArea,
  Input,
  PasswordInput,
} from '@/components/ui'
import {
  formatMoneyInput,
  normalizeMoneyInput,
} from '@/components/ui/money-input.utils'

describe('componentes fundamentales', () => {
  it('separa la presentación monetaria del valor enviado', () => {
    expect(normalizeMoneyInput('56.000')).toBe('56000')
    expect(normalizeMoneyInput('56.000,25')).toBe('56000.25')
    expect(formatMoneyInput('56000.25')).toBe('56.000,25')
  })
  it('mantiene el botón estable y accesible mientras carga', () => {
    render(<Button loading>Guardar cambios</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveTextContent('Guardar cambios')
  })
  it('permite mostrar y ocultar una contraseña', async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Contraseña" />)
    const input = screen.getByLabelText('Contraseña')
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(input).toHaveAttribute('type', 'password')
    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
    expect(toggle).toHaveAccessibleName('Ocultar contraseña')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await user.click(toggle)
    expect(input).toHaveAttribute('type', 'password')
  })
  it('asocia un error visible con el campo', () => {
    render(
      <FormField label="Correo" htmlFor="email" error="El correo no es válido">
        <Input id="email" />
      </FormField>,
    )
    expect(screen.getByLabelText('Correo')).toHaveAccessibleDescription(
      'El correo no es válido',
    )
    expect(screen.getByRole('alert')).toBeVisible()
  })
  it('permite desplazar una fila con rueda y controles visibles', async () => {
    const user = userEvent.setup()
    render(
      <HorizontalScrollArea label="tarjetas">
        <div>Uno</div>
        <div>Dos</div>
      </HorizontalScrollArea>,
    )
    const region = screen.getByRole('region', { name: 'tarjetas' })
    Object.defineProperties(region, {
      clientWidth: { configurable: true, value: 300 },
      scrollWidth: { configurable: true, value: 900 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    })
    const scrollBy = vi.fn()
    Object.defineProperty(region, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    })
    fireEvent.scroll(region)
    await user.click(
      screen.getByRole('button', {
        name: 'Desplazar tarjetas a la derecha',
      }),
    )
    expect(scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' })
    fireEvent.wheel(region, { deltaY: 120 })
    expect(region.scrollLeft).toBe(120)
  })
})
