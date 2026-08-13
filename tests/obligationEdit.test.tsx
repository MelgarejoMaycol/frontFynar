import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { EditObligationForm } from '@/features/liabilities/DetailPages'

const mocks = vi.hoisted(() => ({ update: vi.fn() }))
vi.mock('@/features/liabilities/api', () => ({
  liabilitiesApi: {
    updateObligation: (...args: unknown[]) => mocks.update(...args),
  },
}))

const obligation = {
  id: 'obligation-1',
  name: 'Plan celular',
  description: null,
  expectedAmount: '30000.00',
  currency: 'COP',
  amountType: 'FIXED' as const,
  status: 'ACTIVE' as const,
  paymentAccountId: null,
  categoryId: null,
  remindersEnabled: true,
  recurrenceRules: {
    frequency: 'MONTHLY' as const,
    intervalValue: 1,
    dayOfWeek: null,
    dayOfMonth: 12,
    startsOn: '2026-08-12',
    endsOn: null,
    nextRunAt: null,
  },
  occurrences: [],
}

describe('edición global de obligación', () => {
  it('envía cambios globales sin tocar ocurrencias históricas', async () => {
    mocks.update.mockResolvedValue({
      data: { ...obligation, name: 'Plan móvil' },
    })
    const close = vi.fn()
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EditObligationForm
          w="workspace-1"
          obligation={obligation}
          close={close}
        />
      </QueryClientProvider>,
    )
    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Plan móvil' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        'workspace-1',
        'obligation-1',
        expect.objectContaining({
          name: 'Plan móvil',
          expectedAmount: '30000.00',
        }),
      ),
    )
    expect(mocks.update.mock.calls[0]?.[2]).not.toHaveProperty('occurrences')
    await waitFor(() => expect(close).toHaveBeenCalled())
  })
})
