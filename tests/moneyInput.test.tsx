import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Controller, useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { MoneyInput } from '@/components/ui'

describe('MoneyInput transversal', () => {
  it('captura el saldo bancario en centavos progresivos', async () => {
    const user = userEvent.setup()
    const changed = vi.fn()
    render(
      <MoneyInput
        aria-label="Saldo inicial"
        minorUnits
        onValueChange={changed}
      />,
    )
    const input = screen.getByLabelText('Saldo inicial')
    await user.type(input, '9876543')
    expect(input).toHaveValue('98.765,43')
    expect(changed).toHaveBeenLastCalledWith('98765.43')
    await user.keyboard('{Backspace}')
    expect(input).toHaveValue('9.876,54')
    fireEvent.change(input, { target: { value: '$ 1.234,56' } })
    expect(input).toHaveValue('1.234,56')
    expect(changed).toHaveBeenLastCalledWith('1234.56')
  })
  it('permite escribir montos naturales y formatea al salir', async () => {
    const user = userEvent.setup()
    render(<MoneyInput aria-label="Importe natural" />)
    const input = screen.getByLabelText('Importe natural')
    await user.type(input, '56000')
    expect(input).toHaveValue('56000')
    await user.tab()
    expect(input).toHaveValue('56.000,00')
    await user.click(input)
    await user.keyboard('{Backspace}')
    expect(input).toHaveValue('5600')
  })
  it.each([
    ['9', '9,00'],
    ['98', '98,00'],
    ['987', '987,00'],
    ['9876', '9.876,00'],
    ['56000', '56.000,00'],
    ['98765,43', '98.765,43'],
    ['1500000', '1.500.000,00'],
  ])('formatea %s mientras se escribe como %s', async (typed, expected) => {
    const user = userEvent.setup()
    render(<MoneyInput aria-label="Monto" />)
    const input = screen.getByLabelText('Monto') as HTMLInputElement
    await user.type(input, typed)
    await user.tab()
    expect(input).toHaveValue(expected)
  })

  it.each([
    ['1234567', '1.234.567,00', '1234567.00'],
    ['1.234.567', '1.234.567,00', '1234567.00'],
    ['1234567,89', '1.234.567,89', '1234567.89'],
    ['1.234.567,89', '1.234.567,89', '1234567.89'],
    ['1234567.89', '1.234.567,89', '1234567.89'],
    ['$ 1.234.567,89', '1.234.567,89', '1234567.89'],
    ['COP 1.234.567,89', '1.234.567,89', '1234567.89'],
    ['$ 1.500.000,00', '1.500.000,00', '1500000.00'],
  ])('normaliza al pegar %s', (pasted, visual, api) => {
    render(
      <form data-testid="form">
        <MoneyInput aria-label="Monto" name="amount" />
      </form>,
    )
    fireEvent.change(screen.getByLabelText('Monto'), {
      target: { value: pasted, selectionStart: pasted.length },
    })
    expect(screen.getByLabelText('Monto')).toHaveValue(visual)
    expect(
      new FormData(screen.getByTestId('form') as HTMLFormElement).get('amount'),
    ).toBe(api)
  })

  it('distingue vacío, cero y centavos, limita decimales y permite reemplazar', async () => {
    const user = userEvent.setup()
    render(<MoneyInput aria-label="Monto" />)
    const input = screen.getByLabelText('Monto') as HTMLInputElement
    await user.type(input, '0,01')
    expect(input).toHaveValue('0,01')
    await user.clear(input)
    expect(input).toHaveValue('')
    await user.type(input, '12456')
    expect(input).toHaveValue('12456')
    await user.clear(input)
    await user.type(input, '1234567')
    input.setSelectionRange(0, 2)
    await user.type(input, '9', { skipClick: true })
    expect(input).toHaveValue('934567')
  })

  it('integra React Hook Form y entrega el decimal normalizado', async () => {
    const submit = vi.fn()
    function Example() {
      const { control, handleSubmit } = useForm({
        defaultValues: { amount: '' },
      })
      return (
        <form onSubmit={handleSubmit(submit)}>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <MoneyInput
                aria-label="Monto RHF"
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
          <button type="submit">Enviar</button>
        </form>
      )
    }
    const user = userEvent.setup()
    render(<Example />)
    await user.type(screen.getByLabelText('Monto RHF'), '124567,43')
    expect(screen.getByLabelText('Monto RHF')).toHaveValue('124567,43')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(submit).toHaveBeenCalledWith(
      { amount: '124567.43' },
      expect.anything(),
    )
  })
})
