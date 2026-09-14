import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExchangeRateConverter } from '@/features/exchange-rates'

const mocks = vi.hoisted(() => ({
  convert: vi.fn(),
  reset: vi.fn(),
}))

vi.mock('@/features/exchange-rates/hooks/exchange-rates.hooks', () => ({
  useExchangeCurrencies: () => ({
    isPending: false,
    isError: false,
    data: {
      defaultBase: 'COP',
      currencies: [
        { code: 'COP', name: 'Peso colombiano', symbol: '$', minorUnits: 2 },
        {
          code: 'USD',
          name: 'Dólar estadounidense',
          symbol: 'US$',
          minorUnits: 2,
        },
        { code: 'EUR', name: 'Euro', symbol: '€', minorUnits: 2 },
      ],
    },
  }),
  useConvertCurrency: () => ({
    mutate: mocks.convert,
    reset: mocks.reset,
    isPending: false,
    isError: false,
    data: null,
  }),
}))

describe('conversor de divisas', () => {
  beforeEach(() => {
    mocks.convert.mockReset()
    mocks.reset.mockReset()
  })

  it('usa la moneda base y envía el monto al backend', async () => {
    const user = userEvent.setup()
    render(<ExchangeRateConverter defaultFrom="COP" />)

    expect(screen.getByLabelText('Moneda de origen')).toHaveValue('COP')
    expect(screen.getByLabelText('Moneda de destino')).toHaveValue('USD')

    await user.type(screen.getByLabelText('Monto a convertir'), '1000000')
    fireEvent.submit(
      screen.getByRole('button', { name: 'Convertir ahora' }).closest('form')!,
    )

    expect(mocks.convert).toHaveBeenCalledWith({
      from: 'COP',
      to: 'USD',
      amount: '1000000',
    })
  })

  it('intercambia las monedas sin modificar el saldo real', async () => {
    const user = userEvent.setup()
    render(<ExchangeRateConverter defaultFrom="COP" />)

    await user.click(screen.getByRole('button', { name: 'Intercambiar monedas' }))

    expect(screen.getByLabelText('Moneda de origen')).toHaveValue('USD')
    expect(screen.getByLabelText('Moneda de destino')).toHaveValue('COP')
    expect(mocks.reset).toHaveBeenCalled()
  })
})
