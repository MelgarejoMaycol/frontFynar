import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DebtForm } from '@/features/liabilities/LiabilitiesPage'

const mocks = vi.hoisted(() => ({ estimate: vi.fn(), create: vi.fn() }))

vi.mock('@/features/liabilities/api', () => ({
  liabilitiesApi: { estimate: (...args: unknown[]) => mocks.estimate(...args) },
}))
vi.mock('@/features/liabilities/hooks', () => ({
  useCreateDebt: () => ({
    mutateAsync: mocks.create,
    isPending: false,
    error: null,
  }),
}))

const estimated = {
  originalPrincipal: {
    value: '10000000',
    source: 'PROVIDED',
    quality: 'EXACT',
    derivedFrom: [],
  },
  currentBalance: {
    value: '10000000',
    source: 'PROVIDED',
    quality: 'EXACT',
    derivedFrom: [],
  },
  paymentAmount: {
    value: '499241.02',
    source: 'CALCULATED',
    quality: 'EXACT',
    derivedFrom: [],
  },
  periodicRate: {
    value: '0.015',
    source: 'CALCULATED',
    quality: 'EXACT',
    derivedFrom: [],
  },
  totalInstallments: {
    value: null,
    source: 'UNKNOWN',
    quality: 'INSUFFICIENT_DATA',
    derivedFrom: [],
  },
  installmentsPaid: {
    value: null,
    source: 'UNKNOWN',
    quality: 'INSUFFICIENT_DATA',
    derivedFrom: [],
  },
  remainingInstallments: {
    value: 24,
    source: 'PROVIDED',
    quality: 'EXACT',
    derivedFrom: [],
  },
  estimatedEndDate: {
    value: '2028-08-24T00:00:00.000Z',
    source: 'CALCULATED',
    quality: 'EXACT',
    derivedFrom: [],
  },
  issues: [],
  assumptions: [],
  overallQuality: 'EXACT',
}

describe('vigencia del estimador de créditos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('oculta un cálculo anterior al editar y no lo restaura si falla el siguiente request', async () => {
    mocks.estimate.mockResolvedValueOnce({ data: estimated })
    render(
      <DebtForm workspaceId="workspace-1" currency="COP" close={vi.fn()} />,
    )
    fireEvent.change(screen.getByLabelText('Monto original'), {
      target: { value: '1000000000' },
    })
    fireEvent.change(screen.getByLabelText(/Saldo pendiente actualmente/), {
      target: { value: '1000000000' },
    })
    fireEvent.change(screen.getByLabelText(/Número de cuotas restantes/), {
      target: { value: '24' },
    })
    fireEvent.change(screen.getByLabelText(/Tasa de interés/), {
      target: { value: '1,50' },
    })
    fireEvent.change(screen.getByLabelText('Fecha de la próxima cuota'), {
      target: { value: '2026-09-24' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Completar datos faltantes' }),
    )
    expect(
      await screen.findByText('Fecha estimada de finalización'),
    ).toBeVisible()

    fireEvent.change(screen.getByLabelText(/Tasa de interés/), {
      target: { value: '2,00' },
    })
    expect(
      screen.queryByText('Fecha estimada de finalización'),
    ).not.toBeInTheDocument()

    mocks.estimate.mockRejectedValueOnce(new Error('Validación nueva'))
    fireEvent.click(
      screen.getByRole('button', { name: 'Completar datos faltantes' }),
    )
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Validación nueva'),
    )
    expect(
      screen.queryByText('Fecha estimada de finalización'),
    ).not.toBeInTheDocument()
  })
})
