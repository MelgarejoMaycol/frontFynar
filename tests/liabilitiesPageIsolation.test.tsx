import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LiabilitiesPage } from '@/features/liabilities/LiabilitiesPage'

const mocks = vi.hoisted(() => ({
  summary: vi.fn(),
  upcoming: vi.fn(),
  calendar: vi.fn(),
  debts: vi.fn(),
  obligations: vi.fn(),
  cards: vi.fn(),
  retry: vi.fn(),
  canWrite: vi.fn(),
}))

vi.mock('@/features/workspace', () => ({
  useActiveWorkspace: () => ({
    activeWorkspace: { id: 'workspace-1', baseCurrency: 'COP' },
  }),
  usePermission: () => mocks.canWrite(),
}))
vi.mock('@/features/liabilities/hooks', () => ({
  useSummary: () => mocks.summary(),
  useUpcoming: () => mocks.upcoming(),
  useCalendarRange: () => mocks.calendar(),
  useDebts: () => mocks.debts(),
  useObligations: () => mocks.obligations(),
  useCards: () => mocks.cards(),
  useCreateDebt: () => ({ isPending: false, error: null, mutate: vi.fn() }),
  useCreateObligation: () => ({
    isPending: false,
    error: null,
    mutate: vi.fn(),
  }),
  useLiabilityMutation: () => ({
    isPending: false,
    error: null,
    reset: vi.fn(),
    mutate: vi.fn(),
  }),
}))

const ok = (data: unknown) => ({
  data,
  isPending: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
})
const failed = () => ({
  data: undefined,
  isPending: false,
  isError: true,
  error: new Error('Error interno del servidor'),
  refetch: mocks.retry,
})

describe('aislamiento de consultas en Créditos y pagos', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-08-26T12:00:00Z'))
    vi.clearAllMocks()
    mocks.summary.mockReturnValue(
      ok({ summariesByCurrency: [], nextPayment: null }),
    )
    mocks.upcoming.mockReturnValue(ok([]))
    mocks.calendar.mockReturnValue(ok([]))
    mocks.debts.mockReturnValue(ok({ items: [], page: 1, totalPages: 1 }))
    mocks.obligations.mockReturnValue(ok([]))
    mocks.cards.mockReturnValue(ok([]))
    mocks.canWrite.mockReturnValue(false)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('mantiene disponible Tarjetas aunque falle el resumen', () => {
    mocks.summary.mockReturnValue(failed())
    render(
      <MemoryRouter initialEntries={['/app/debts?tab=cards']}>
        <LiabilitiesPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('No tienes tarjetas registradas')).toBeVisible()
    expect(
      screen.queryByText('No pudimos cargar el resumen'),
    ).not.toBeInTheDocument()
  })

  it('reintenta solamente la consulta de créditos', () => {
    mocks.debts.mockReturnValue(failed())
    render(
      <MemoryRouter initialEntries={['/app/debts?tab=debts']}>
        <LiabilitiesPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(mocks.retry).toHaveBeenCalledOnce()
  })

  it('abre el recurso correcto desde próximo pago y próximos vencimientos', () => {
    mocks.summary.mockReturnValue(
      ok({
        summariesByCurrency: [],
        nextPayment: {
          type: 'CARD_STATEMENT',
          id: 'statement-1',
          resourceId: 'card-1',
          name: 'Visa',
          amount: '180000',
          currency: 'COP',
          date: '2026-09-05',
        },
      }),
    )
    const agenda = [
      {
        type: 'OBLIGATION',
        id: 'occurrence-1',
        resourceId: 'obligation-1',
        name: 'Celular',
        amount: '30000',
        currency: 'COP',
        date: '2026-09-20',
        status: 'PENDING',
      },
    ]
    mocks.upcoming.mockReturnValue(ok(agenda))
    mocks.calendar.mockReturnValue(ok(agenda))
    render(
      <MemoryRouter initialEntries={['/app/debts']}>
        <LiabilitiesPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Visa').closest('a')).toHaveAttribute(
      'href',
      '/app/debts/cards/card-1',
    )
    expect(screen.getByText('Celular').closest('a')).toHaveAttribute(
      'href',
      '/app/debts/obligations/obligation-1',
    )
  })
  it('presenta pago recurrente en español con detalle y menú secundario', () => {
    mocks.canWrite.mockReturnValue(true)
    mocks.obligations.mockReturnValue(
      ok([
        {
          id: 'obligation-1',
          name: 'Internet hogar',
          description: null,
          expectedAmount: '85000.00',
          currency: 'COP',
          amountType: 'VARIABLE',
          status: 'ACTIVE',
          paymentAccountId: null,
          categoryId: null,
          remindersEnabled: true,
          recurrenceRules: {
            frequency: 'MONTHLY',
            intervalValue: 1,
            dayOfWeek: null,
            dayOfMonth: 5,
            startsOn: '2026-09-05',
            endsOn: null,
            nextRunAt: '2026-10-05',
          },
          occurrences: [
            {
              id: 'occ-1',
              obligationId: 'obligation-1',
              dueDate: '2026-09-05',
              amount: '85000.00',
              paidAmount: '0.00',
              status: 'PENDING',
              paidAt: null,
            },
          ],
        },
      ]),
    )
    render(
      <MemoryRouter initialEntries={['/app/debts?tab=obligations']}>
        <LiabilitiesPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Mensual', { selector: 'dd' })).toBeVisible()
    expect(screen.queryByText('MONTHLY')).not.toBeInTheDocument()
    expect(screen.getByText('5/09/2026')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ver detalles' })).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Eliminar' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Acciones de Internet hogar'))
    expect(screen.getByRole('link', { name: 'Registrar pago' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Actualizar valor' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Archivar' })).toBeVisible()
  })
  it('limita el menú archivado a restaurar e historial', () => {
    mocks.canWrite.mockReturnValue(true)
    mocks.obligations.mockReturnValue(
      ok([
        {
          id: 'obligation-archived',
          name: 'Spotify QA',
          description: null,
          expectedAmount: '20000.00',
          currency: 'COP',
          amountType: 'FIXED',
          status: 'CANCELLED',
          deletedAt: '2026-08-28T12:00:00Z',
          paymentAccountId: null,
          categoryId: null,
          remindersEnabled: true,
          recurrenceRules: {
            frequency: 'MONTHLY',
            intervalValue: 1,
            dayOfWeek: null,
            dayOfMonth: 28,
            startsOn: '2026-06-28',
            endsOn: null,
            nextRunAt: null,
          },
          occurrences: [],
        },
      ]),
    )
    render(
      <MemoryRouter initialEntries={['/app/debts?tab=obligations']}>
        <LiabilitiesPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Archivados' }))
    fireEvent.click(screen.getByLabelText('Acciones de Spotify QA'))
    expect(screen.getByRole('button', { name: 'Restaurar' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ver historial' })).toBeVisible()
    expect(screen.queryByText('Registrar pago')).not.toBeInTheDocument()
    expect(screen.queryByText('Actualizar valor')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Archivar' })).not.toBeInTheDocument()
  })
  it('presenta la nueva tarjeta con ejemplos y checkbox accesible', () => {
    mocks.canWrite.mockReturnValue(true)
    render(
      <MemoryRouter initialEntries={['/app/debts?tab=cards']}>
        <LiabilitiesPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Nueva tarjeta' })[0]!)
    expect(screen.getByPlaceholderText('Ej. Visa principal')).toBeVisible()
    expect(screen.getByPlaceholderText('Ej. Banco de Bogotá')).toBeVisible()
    expect(screen.getByPlaceholderText('Ej. 5.000.000')).toBeVisible()
    const paid = screen.getByRole('checkbox', {
      name: /Ya pagué el período actual/,
    })
    expect(paid).not.toBeChecked()
    fireEvent.click(screen.getByText('Ya pagué el período actual'))
    expect(paid).toBeChecked()
  })
  it('deduplica próximos pagos sin depender de una vista de calendario', () => {
    const base = {
      currency: 'COP',
      status: 'PENDING',
      source: 'SCHEDULED',
      amountLabel: 'Monto pendiente',
    }
    mocks.upcoming.mockReturnValue(
      ok([
        {
          ...base,
          type: 'DEBT_INSTALLMENT',
          id: 'd1',
          resourceId: 'debt-1',
          name: 'Crédito',
          amount: '634453.17',
          date: '2026-09-24',
          daysRemaining: 29,
        },
        {
          ...base,
          type: 'OBLIGATION',
          id: 'o1',
          resourceId: 'obligation-1',
          name: 'Internet',
          amount: '85000.00',
          date: '2026-09-25',
          daysRemaining: 30,
        },
        {
          ...base,
          type: 'CARD_STATEMENT',
          id: 'c1',
          resourceId: 'card-1',
          name: 'Tarjeta Nu',
          amount: '420000.00',
          date: '2026-09-28',
          daysRemaining: 33,
        },
        {
          ...base,
          type: 'OBLIGATION',
          id: 'o1',
          resourceId: 'obligation-1',
          name: 'Internet',
          amount: '85000.00',
          date: '2026-09-25',
          daysRemaining: 30,
        },
      ]),
    )
    render(
      <MemoryRouter initialEntries={['/app/debts']}>
        <LiabilitiesPage />
      </MemoryRouter>,
    )
    expect(screen.getAllByText('Internet')).toHaveLength(1)
    expect(
      screen.queryByRole('button', { name: /Calendario/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Pago recurrente Internet/ }),
    ).toHaveAttribute('href', '/app/debts/obligations/obligation-1')
  }, 15_000)
})
