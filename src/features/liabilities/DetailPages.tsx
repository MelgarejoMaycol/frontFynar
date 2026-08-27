import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import {
  ArrowUpRight,
  CreditCard,
  FileText,
  MoreHorizontal,
  Pencil,
  ShoppingCart,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  Dropdown,
  FormField,
  Input,
  MoneyInput,
  Select,
  Textarea,
} from '@/components/ui'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useAccounts } from '@/features/accounts/hooks/accounts.hooks'
import { useCategories } from '@/features/categories/hooks/categories.hooks'
import {
  isoToWorkspaceDateTimeValue,
  workspaceDateTimeToIso,
} from '@/features/transactions/transactions.format'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { liabilitiesApi } from './api'
import {
  liabilityKeys,
  useCardActivity,
  useCards,
  useDebt,
  useLiabilityMutation,
  useObligations,
  usePurchases,
  useStatements,
} from './hooks'
import {
  calendarDate,
  idempotency,
  money,
  statusLabel,
  statusTone,
  shortCalendarDate,
} from './format'
import type {
  Card as CardType,
  CardPaymentInput,
  CardCashAdvanceInput,
  DebtInstallment,
  DebtPayment,
  DebtPaymentInput,
  Obligation,
  Occurrence,
  Statement,
} from './types'
import styles from './liabilities.module.css'
import { ModulePageHeader } from './ModulePageHeader'
import { monthlyCardPayment } from './card-payment.utils'
import { decimalRateToPercent } from './credit-form.utils'
const frequencyLabel = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  BIMONTHLY: 'Bimestral',
  SEMIANNUAL: 'Semestral',
} as const
const message = (e: unknown) =>
  e instanceof Error ? e.message : 'No fue posible completar la operación.'
const today = () => new Date().toISOString().slice(0, 10)
const nowInWorkspace = (timezone: string) =>
  isoToWorkspaceDateTimeValue(new Date().toISOString(), timezone)
export function DebtDetailPage() {
  const { debtId = '' } = useParams()
  const { activeWorkspace: w } = useActiveWorkspace()
  const q = useDebt(w!.id, debtId)
  const canWrite = usePermission('debts.write')
  const [action, setAction] = useState<
    'pay' | 'prepay' | 'reconcile' | 'installment' | 'reverse' | null
  >(null)
  const [selected, setSelected] = useState<DebtInstallment | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<DebtPayment | null>(
    null,
  )
  if (q.isPending) return <PageLoader />
  if (q.isError || !q.data)
    return (
      <ErrorState
        title="No pudimos cargar el crédito"
        message={message(q.error)}
        onRetry={() => void q.refetch()}
      />
    )
  const d = q.data,
    paid = Number(d.originalAmount) - Number(d.currentBalance),
    activePayments = (d.debtPayments ?? []).filter(
      (payment) => !payment.reversedAt,
    ),
    principalPaid = activePayments.reduce(
      (sum, payment) =>
        sum +
        Number(payment.principalAmount) +
        Number(payment.extraPaymentAmount),
      0,
    ),
    interestPaid = activePayments.reduce(
      (sum, payment) => sum + Number(payment.interestAmount),
      0,
    ),
    remainingInstallments = (d.debtInstallments ?? []).filter(
      (installment) =>
        installment.status !== 'PAID' && installment.status !== 'CANCELLED',
    ).length,
    nextInstallment = (d.debtInstallments ?? []).find((installment) =>
      ['PENDING', 'PARTIAL', 'OVERDUE'].includes(installment.status),
    ),
    progress = Number(d.originalAmount)
      ? Math.max(0, (paid / Number(d.originalAmount)) * 100)
      : 0
  return (
    <div className={styles.page}>
      <Link to="/app/debts?tab=debts">← Volver a créditos</Link>
      <ModulePageHeader
        title={d.name}
        description={d.lenderName || 'Entidad no informada'}
        actions={
          canWrite ? (
            <>
              <Button
                variant="secondary"
                onClick={() => setAction('reconcile')}
              >
                Conciliar
              </Button>
              <Button onClick={() => setAction('prepay')}>
                Registrar abono
              </Button>
            </>
          ) : undefined
        }
      />
      <Card className={styles.heroCard}>
        <span>Saldo pendiente actualmente</span>
        <strong>{money(d.currentBalance, d.currency)}</strong>
        <progress max="100" value={progress} />
        <span>{progress.toFixed(0)}% del capital pagado</span>
        <div className={styles.metrics}>
          <Metric
            label="Monto original"
            value={money(d.originalAmount, d.currency)}
          />
          <Metric
            label="Próxima cuota"
            value={money(d.installmentAmount, d.currency)}
          />
          {nextInstallment && (
            <Metric
              label="Próximo vencimiento"
              value={calendarDate(nextInstallment.dueDate)}
            />
          )}
          <Metric label="Tasa" value={decimalRateToPercent(d.interestRate)} />
          <Metric
            label="Frecuencia"
            value={frequencyLabel[d.paymentFrequency]}
          />
          <Metric
            label="Final estimado"
            value={calendarDate(d.estimatedEndDate)}
          />
          <Metric
            label="Cuotas restantes"
            value={String(remainingInstallments)}
          />
          <Metric
            label="Capital pagado"
            value={money(principalPaid.toFixed(2), d.currency)}
          />
          <Metric
            label="Interés pagado"
            value={money(interestPaid.toFixed(2), d.currency)}
          />
        </div>
      </Card>
      <section>
        <h2>Cronograma</h2>
        {d.debtInstallments?.length ? (
          <>
            <div className={styles.scheduleTable}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Vencimiento</th>
                    <th>Saldo inicial</th>
                    <th>Capital</th>
                    <th>Interés</th>
                    <th>Cargos</th>
                    <th>Total</th>
                    <th>Pagado</th>
                    <th>Estado</th>
                    <th>Saldo final</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {d.debtInstallments.map((i) => (
                    <tr key={i.id}>
                      <td>{i.installmentNumber}</td>
                      <td>{calendarDate(i.dueDate)}</td>
                      <td>{money(i.openingBalance, d.currency)}</td>
                      <td>{money(i.principalAmount, d.currency)}</td>
                      <td>{money(i.interestAmount, d.currency)}</td>
                      <td>
                        {money(
                          (
                            Number(i.insuranceAmount) + Number(i.feeAmount)
                          ).toFixed(2),
                          d.currency,
                        )}
                      </td>
                      <td>{money(i.totalAmount, d.currency)}</td>
                      <td>{money(i.paidAmount, d.currency)}</td>
                      <td>
                        <Badge tone={statusTone(i.status)}>
                          {statusLabel[i.status]}
                        </Badge>
                      </td>
                      <td>{money(i.closingBalance, d.currency)}</td>
                      <td>
                        {canWrite &&
                          ['PENDING', 'PARTIAL', 'OVERDUE'].includes(
                            i.status,
                          ) && (
                            <>
                              <Button
                                size="small"
                                onClick={() => {
                                  setSelected(i)
                                  setAction('pay')
                                }}
                              >
                                Pagar
                              </Button>
                              <Button
                                size="small"
                                variant="ghost"
                                onClick={() => {
                                  setSelected(i)
                                  setAction('installment')
                                }}
                              >
                                Modificar
                              </Button>
                            </>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.scheduleCards}>
              {d.debtInstallments.map((i) => (
                <Card className={styles.installment} key={i.id}>
                  <div className={styles.cardHead}>
                    <strong>
                      Cuota {i.installmentNumber} de{' '}
                      {d.debtInstallments!.length}
                    </strong>
                    <Badge tone={statusTone(i.status)}>
                      {statusLabel[i.status]}
                    </Badge>
                  </div>
                  <span>{calendarDate(i.dueDate)}</span>
                  <dl>
                    <div>
                      <dt>Total</dt>
                      <dd>{money(i.totalAmount, d.currency)}</dd>
                    </div>
                    <div>
                      <dt>Saldo inicial</dt>
                      <dd>{money(i.openingBalance, d.currency)}</dd>
                    </div>
                    <div>
                      <dt>Capital</dt>
                      <dd>{money(i.principalAmount, d.currency)}</dd>
                    </div>
                    <div>
                      <dt>Interés</dt>
                      <dd>{money(i.interestAmount, d.currency)}</dd>
                    </div>
                    {Number(i.insuranceAmount) + Number(i.feeAmount) > 0 && (
                      <div>
                        <dt>Otros cargos</dt>
                        <dd>
                          {money(
                            (
                              Number(i.insuranceAmount) + Number(i.feeAmount)
                            ).toFixed(2),
                            d.currency,
                          )}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt>Pagado</dt>
                      <dd>{money(i.paidAmount, d.currency)}</dd>
                    </div>
                    <div>
                      <dt>Saldo posterior</dt>
                      <dd>{money(i.closingBalance, d.currency)}</dd>
                    </div>
                  </dl>
                  {canWrite &&
                    ['PENDING', 'PARTIAL', 'OVERDUE'].includes(i.status) && (
                      <Button
                        onClick={() => {
                          setSelected(i)
                          setAction('pay')
                        }}
                      >
                        Pagar cuota
                      </Button>
                    )}
                </Card>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="Sin cronograma disponible"
            message="Este crédito no tiene suficientes datos para proyectar cuotas."
          />
        )}
      </section>
      <section>
        <h2>Historial de pagos</h2>
        {d.debtPayments?.length ? (
          <div className={styles.list}>
            {d.debtPayments.map((payment) => (
              <Card className={styles.row} key={payment.id}>
                <div>
                  <strong>{money(payment.totalAmount, d.currency)}</strong>
                  <small>
                    {calendarDate(payment.paidAt)} ·{' '}
                    {payment.account?.name ?? 'Cuenta no disponible'}
                    {payment.installmentNumber
                      ? ` · Cuota ${payment.installmentNumber}`
                      : ''}
                  </small>
                </div>
                <div className={styles.amount}>
                  {payment.reversedAt ? (
                    <Badge tone="neutral">Revertido</Badge>
                  ) : canWrite ? (
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => {
                        setSelectedPayment(payment)
                        setAction('reverse')
                      }}
                    >
                      Revertir pago
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin pagos registrados"
            message="Los pagos del crédito aparecerán aquí."
          />
        )}
      </section>
      <Dialog
        open={action === 'pay'}
        title="Registrar pago"
        onClose={() => setAction(null)}
      >
        {selected && (
          <PaymentForm
            workspaceId={w!.id}
            timezone={w!.timezone}
            debtId={d.id}
            installment={selected}
            currency={d.currency}
            close={() => setAction(null)}
          />
        )}
      </Dialog>
      <Dialog
        open={action === 'reverse'}
        title="Confirmar reversión del pago"
        onClose={() => setAction(null)}
      >
        {selectedPayment && (
          <ReversePaymentForm
            workspaceId={w!.id}
            debtId={d.id}
            payment={selectedPayment}
            currency={d.currency}
            close={() => setAction(null)}
          />
        )}
      </Dialog>
      <Dialog
        open={action === 'prepay'}
        title="Abono extraordinario"
        onClose={() => setAction(null)}
      >
        <PrepaymentForm
          workspaceId={w!.id}
          timezone={w!.timezone}
          debtId={d.id}
          currency={d.currency}
          close={() => setAction(null)}
        />
      </Dialog>
      <Dialog
        open={action === 'reconcile'}
        title="Conciliar crédito"
        onClose={() => setAction(null)}
      >
        <ReconciliationForm
          workspaceId={w!.id}
          debtId={d.id}
          calculated={d.currentBalance}
          currency={d.currency}
          close={() => setAction(null)}
        />
      </Dialog>
      <Dialog
        open={action === 'installment'}
        title="Modificar cuota futura"
        onClose={() => setAction(null)}
      >
        {selected && (
          <InstallmentForm
            workspaceId={w!.id}
            debtId={d.id}
            installment={selected}
            currency={d.currency}
            close={() => setAction(null)}
          />
        )}
      </Dialog>
    </div>
  )
}
function ReversePaymentForm({
  workspaceId,
  debtId,
  payment,
  currency,
  close,
}: {
  workspaceId: string
  debtId: string
  payment: DebtPayment
  currency: string
  close: () => void
}) {
  const mutate = useLiabilityMutation(
    workspaceId,
    (reason: string) =>
      liabilitiesApi.reverseDebtPayment(
        workspaceId,
        debtId,
        payment.id,
        reason,
      ),
    liabilityKeys.debt(workspaceId, debtId),
  )
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        mutate.mutate(String(new FormData(event.currentTarget).get('reason')), {
          onSuccess: close,
        })
      }}
    >
      <p>
        Esta reversión restaura el saldo del crédito y de la cuenta pagadora, y
        cancela el movimiento financiero asociado.
      </p>
      <dl className={styles.resource}>
        <div>
          <dt>Monto</dt>
          <dd>{money(payment.totalAmount, currency)}</dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{calendarDate(payment.paidAt)}</dd>
        </div>
        <div>
          <dt>Cuenta</dt>
          <dd>{payment.account?.name ?? 'No disponible'}</dd>
        </div>
        <div>
          <dt>Cuota</dt>
          <dd>{payment.installmentNumber ?? 'Abono'}</dd>
        </div>
        <div>
          <dt>Capital</dt>
          <dd>{money(payment.principalAmount, currency)}</dd>
        </div>
        <div>
          <dt>Intereses</dt>
          <dd>{money(payment.interestAmount, currency)}</dd>
        </div>
        <div>
          <dt>Seguro</dt>
          <dd>{money(payment.insuranceAmount, currency)}</dd>
        </div>
        <div>
          <dt>Cargos</dt>
          <dd>{money(payment.feeAmount, currency)}</dd>
        </div>
        <div>
          <dt>Efecto esperado</dt>
          <dd>El pago dejará de contar y los saldos se restaurarán.</dd>
        </div>
      </dl>
      <FormField label="Motivo de la reversión" htmlFor="reverse-reason">
        <Textarea
          id="reverse-reason"
          name="reason"
          minLength={3}
          maxLength={500}
          required
        />
      </FormField>
      <MutationActions
        mutation={mutate}
        close={close}
        label="Confirmar reversión"
      />
    </form>
  )
}
function PaymentForm({
  workspaceId,
  timezone,
  debtId,
  installment,
  currency,
  close,
}: {
  workspaceId: string
  timezone: string
  debtId: string
  installment: DebtInstallment
  currency: string
  close: () => void
}) {
  const accounts = useAccounts(workspaceId)
  const mutate = useLiabilityMutation(
    workspaceId,
    (i: DebtPaymentInput) =>
      liabilitiesApi.payDebt(workspaceId, debtId, installment.id, i),
    liabilityKeys.debt(workspaceId, debtId),
  )
  const remaining = (
    Number(installment.totalAmount) - Number(installment.paidAmount)
  ).toFixed(2)
  const [amount, setAmount] = useState(remaining)
  const [strategy, setStrategy] = useState<'REDUCE_TERM' | 'REDUCE_PAYMENT'>(
    'REDUCE_TERM',
  )
  const hasExtra = Number(amount || 0) > Number(remaining)
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget),
      amount = String(f.get('amount'))
    mutate.mutate(
      {
        accountId: String(f.get('accountId')),
        amount,
        paidAt: workspaceDateTimeToIso(String(f.get('paidAt')), timezone),
        idempotencyKey: idempotency(),
        ...(hasExtra ? { strategy } : {}),
      },
      { onSuccess: close },
    )
  }
  return (
    <form className={styles.form} onSubmit={submit}>
      <p>
        Cuota: {money(installment.totalAmount, currency)} · Pagado:{' '}
        {money(installment.paidAmount, currency)} · Falta:{' '}
        {money(remaining, currency)}
      </p>
      <FormField label="Cuenta pagadora" htmlFor="pay-account">
        <Select id="pay-account" name="accountId" required>
          {accounts.data
            ?.filter((a) => a.nature === 'ASSET' && a.currency === currency)
            .map((a) => (
              <option value={a.id} key={a.id}>
                {a.name} · {money(a.currentBalance, a.currency)}
              </option>
            ))}
        </Select>
      </FormField>
      <FormField label="Monto" htmlFor="pay-amount">
        <MoneyInput
          id="pay-amount"
          name="amount"
          minorUnits
          value={amount}
          onValueChange={setAmount}
          required
        />
      </FormField>
      {hasExtra && (
        <>
          <p role="status">
            {money(remaining, currency)} completan la cuota y{' '}
            {money((Number(amount) - Number(remaining)).toFixed(2), currency)}{' '}
            se aplicarán como abono extraordinario.
          </p>
          <FormField label="Aplicar el abono para" htmlFor="pay-strategy">
            <Select
              id="pay-strategy"
              value={strategy}
              onChange={(event) =>
                setStrategy(event.target.value as typeof strategy)
              }
            >
              <option value="REDUCE_TERM">Reducir plazo</option>
              <option value="REDUCE_PAYMENT">Reducir cuota</option>
            </Select>
          </FormField>
        </>
      )}
      <FormField label="Fecha" htmlFor="pay-date">
        <Input
          id="pay-date"
          name="paidAt"
          type="datetime-local"
          defaultValue={nowInWorkspace(timezone)}
          required
        />
      </FormField>
      <MutationActions mutation={mutate} close={close} label="Registrar pago" />
    </form>
  )
}
function PrepaymentForm({
  workspaceId,
  timezone,
  debtId,
  currency,
  close,
}: {
  workspaceId: string
  timezone: string
  debtId: string
  currency: string
  close: () => void
}) {
  const accounts = useAccounts(workspaceId)
  const [amount, setAmount] = useState('')
  const [strategy, setStrategy] = useState('REDUCE_TERM')
  const [simulation, setSimulation] = useState<
    Awaited<ReturnType<typeof liabilitiesApi.simulatePrepayment>>['data'] | null
  >(null)
  const simulate = useLiabilityMutation(workspaceId, () =>
    liabilitiesApi.simulatePrepayment(workspaceId, debtId, {
      amount,
      strategy,
    }),
  )
  const apply = useLiabilityMutation(
    workspaceId,
    (i: Record<string, unknown>) =>
      liabilitiesApi.prepay(workspaceId, debtId, i),
    liabilityKeys.debt(workspaceId, debtId),
  )
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        apply.mutate(
          {
            amount,
            strategy,
            accountId: String(f.get('accountId')),
            occurredAt: workspaceDateTimeToIso(
              String(f.get('occurredAt')),
              timezone,
            ),
            idempotencyKey: idempotency(),
          },
          { onSuccess: close },
        )
      }}
    >
      <FormField label="Monto del abono" htmlFor="prepay-amount">
        <MoneyInput
          id="prepay-amount"
          minorUnits
          value={amount}
          onValueChange={setAmount}
          required
        />
      </FormField>
      <FormField label="Objetivo" htmlFor="prepay-strategy">
        <Select
          id="prepay-strategy"
          value={strategy}
          onChange={(e) => {
            setStrategy(e.target.value)
            setSimulation(null)
          }}
        >
          <option value="REDUCE_TERM">Reducir plazo</option>
          <option value="REDUCE_PAYMENT">Reducir cuota</option>
        </Select>
      </FormField>
      <Button
        type="button"
        variant="secondary"
        loading={simulate.isPending}
        onClick={() =>
          simulate.mutate(undefined, {
            onSuccess: (r) => setSimulation(r.data),
          })
        }
      >
        Simular
      </Button>
      {simulation && (
        <Card className={styles.comparison}>
          <div>
            <strong>Antes</strong>
            <span>Saldo {money(simulation.balanceBefore, currency)}</span>
            <span>Cuota {money(simulation.paymentBefore, currency)}</span>
            <span>{simulation.installmentsBefore} cuotas</span>
          </div>
          <div>
            <strong>Después</strong>
            <span>Saldo {money(simulation.balanceAfter, currency)}</span>
            <span>Cuota {money(simulation.paymentAfter, currency)}</span>
            <span>{simulation.installmentsAfter} cuotas</span>
          </div>
        </Card>
      )}
      {simulation && (
        <>
          <FormField label="Cuenta pagadora" htmlFor="prepay-account">
            <Select id="prepay-account" name="accountId" required>
              {accounts.data
                ?.filter((a) => a.nature === 'ASSET' && a.currency === currency)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {money(a.currentBalance, a.currency)}
                  </option>
                ))}
            </Select>
          </FormField>
          <FormField label="Fecha" htmlFor="prepay-date">
            <Input
              id="prepay-date"
              name="occurredAt"
              type="datetime-local"
              defaultValue={nowInWorkspace(timezone)}
              required
            />
          </FormField>
          <MutationActions
            mutation={apply}
            close={close}
            label="Confirmar y aplicar abono"
          />
        </>
      )}
    </form>
  )
}
function ReconciliationForm({
  workspaceId,
  debtId,
  calculated,
  currency,
  close,
}: {
  workspaceId: string
  debtId: string
  calculated: string
  currency: string
  close: () => void
}) {
  const [reported, setReported] = useState(calculated)
  const mutate = useLiabilityMutation(
    workspaceId,
    (i: Record<string, unknown>) =>
      liabilitiesApi.reconcile(workspaceId, debtId, i),
    liabilityKeys.debt(workspaceId, debtId),
  )
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        mutate.mutate(
          {
            reportedBalance: reported,
            effectiveDate: String(f.get('effectiveDate')),
            source: String(f.get('source')),
            notes: String(f.get('notes') || ''),
            ...(f.get('newRate') ? { newRate: String(f.get('newRate')) } : {}),
            ...(f.get('newPayment')
              ? { newPayment: String(f.get('newPayment')) }
              : {}),
          },
          { onSuccess: close },
        )
      }}
    >
      <div className={styles.comparison}>
        <Metric label="Valor Fynar" value={money(calculated, currency)} />
        <Metric label="Valor informado" value={money(reported, currency)} />
        <Metric
          label="Diferencia"
          value={money(
            (Number(reported) - Number(calculated)).toFixed(2),
            currency,
          )}
        />
      </div>
      <FormField
        label="Saldo que muestra tu entidad"
        htmlFor="rec-balance"
        helpText="Ingresa el saldo actual que ves en tu banco o entidad. Fynar conservará el historial y ajustará las proyecciones desde esta fecha."
      >
        <MoneyInput
          id="rec-balance"
          minorUnits
          value={reported}
          onValueChange={setReported}
        />
      </FormField>
      <FormField label="Fecha efectiva" htmlFor="rec-date">
        <Input
          id="rec-date"
          name="effectiveDate"
          type="date"
          defaultValue={today()}
          required
        />
      </FormField>
      <FormField label="Fuente" htmlFor="rec-source">
        <Input
          id="rec-source"
          name="source"
          placeholder="Ej. App del banco"
          required
        />
      </FormField>
      <FormField label="Nueva cuota (opcional)" htmlFor="rec-payment">
        <MoneyInput id="rec-payment" name="newPayment" minorUnits />
      </FormField>
      <FormField label="Nueva tasa (opcional)" htmlFor="rec-rate">
        <Input id="rec-rate" name="newRate" inputMode="decimal" />
      </FormField>
      <FormField label="Notas" htmlFor="rec-notes">
        <Input id="rec-notes" name="notes" />
      </FormField>
      <MutationActions
        mutation={mutate}
        close={close}
        label="Confirmar conciliación"
      />
    </form>
  )
}
function InstallmentForm({
  workspaceId,
  debtId,
  installment,
  currency,
  close,
}: {
  workspaceId: string
  debtId: string
  installment: DebtInstallment
  currency: string
  close: () => void
}) {
  const mutate = useLiabilityMutation(
    workspaceId,
    (i: { amount: string; recalculateFuture: boolean }) =>
      liabilitiesApi.updateInstallment(workspaceId, debtId, installment.id, i),
    liabilityKeys.debt(workspaceId, debtId),
  )
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        mutate.mutate(
          {
            amount: String(f.get('amount')),
            recalculateFuture: f.get('recalculate') === 'yes',
          },
          { onSuccess: close },
        )
      }}
    >
      <p>
        Valor actual: {money(installment.totalAmount, currency)}. Las cuotas
        históricas pagadas no se modificarán.
      </p>
      <FormField label="Nuevo valor" htmlFor="inst-amount">
        <MoneyInput
          id="inst-amount"
          name="amount"
          minorUnits
          defaultValue={installment.totalAmount}
          required
        />
      </FormField>
      <FormField label="Alcance" htmlFor="inst-scope">
        <Select id="inst-scope" name="recalculate">
          <option value="no">Modificar solamente esta cuota</option>
          <option value="yes">Modificar y recalcular cuotas posteriores</option>
        </Select>
      </FormField>
      <MutationActions
        mutation={mutate}
        close={close}
        label="Guardar modificación"
      />
    </form>
  )
}
export function CardDetailPage() {
  const { cardId = '' } = useParams()
  const { activeWorkspace: w } = useActiveWorkspace()
  const cards = useCards(w!.id),
    statements = useStatements(w!.id, cardId),
    purchases = usePurchases(w!.id, cardId),
    activity = useCardActivity(w!.id, cardId)
  const card = cards.data?.find((c) => c.id === cardId)
  const canWrite = usePermission('debts.write')
  const [mode, setMode] = useState<
    | 'purchase'
    | 'statement'
    | 'nextPayment'
    | 'payMonth'
    | 'contribution'
    | 'advance'
    | 'edit'
    | null
  >(null)
  const [selected, setSelected] = useState<Statement | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const action = searchParams.get('action')
    if (
      !['pay', 'pay-month', 'contribution', 'next-payment', 'advance'].includes(
        action ?? '',
      )
    )
      return
    let active = true
    queueMicrotask(() => {
      if (!active) return
      if (action === 'pay' || action === 'pay-month') {
        setSelected(
          card?.nextPayment?.statementId
            ? (statements.data?.find(
                (statement) => statement.id === card.nextPayment?.statementId,
              ) ?? null)
            : null,
        )
        setMode('payMonth')
      } else if (action === 'contribution') {
        setSelected(null)
        setMode('contribution')
      } else if (action === 'advance') {
        setMode('advance')
      } else {
        setMode('nextPayment')
      }
      setSearchParams({}, { replace: true })
    })
    return () => {
      active = false
    }
  }, [card, searchParams, setSearchParams, statements.data])
  if (cards.isPending) return <PageLoader />
  if (cards.isError)
    return (
      <ErrorState
        title="No pudimos cargar la tarjeta"
        message={message(cards.error)}
        onRetry={() => void cards.refetch()}
      />
    )
  if (!card)
    return (
      <ErrorState
        title="Tarjeta no encontrada"
        message="No existe o no pertenece al workspace actual."
      />
    )
  return (
    <div className={styles.page}>
      <Link to="/app/debts?tab=cards">← Volver a tarjetas</Link>
      <ModulePageHeader
        title={card.name}
        description="Comprende, proyecta y paga la deuda de tu tarjeta."
        actions={
          canWrite ? (
            <>
              {Number(card.currentBalance) > 0 && (
                <Button
                  onClick={() => {
                    setSelected(
                      card.nextPayment?.statementId
                        ? (statements.data?.find(
                            (statement) =>
                              statement.id === card.nextPayment?.statementId,
                          ) ?? null)
                        : null,
                    )
                    setMode('payMonth')
                  }}
                >
                  <CreditCard size={17} aria-hidden="true" /> Pagar mes
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setMode('nextPayment')}
              >
                Actualizar próximo pago
              </Button>
              <Dropdown
                label="Más acciones de la tarjeta"
                trigger={<MoreHorizontal aria-hidden="true" />}
              >
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelected(null)
                    setMode('contribution')
                  }}
                >
                  Abonar
                </Button>
                <Button variant="secondary" onClick={() => setMode('purchase')}>
                  <ShoppingCart size={17} aria-hidden="true" /> Registrar compra
                </Button>
                <Button variant="secondary" onClick={() => setMode('advance')}>
                  <ArrowUpRight size={17} aria-hidden="true" /> Registrar
                  adelanto
                </Button>
                <Button variant="secondary" onClick={() => setMode('edit')}>
                  <Pencil size={17} aria-hidden="true" /> Editar tarjeta
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setMode('statement')}
                >
                  <FileText size={17} aria-hidden="true" /> Actualizar extracto
                  completo
                </Button>
              </Dropdown>
            </>
          ) : undefined
        }
      />
      <CardHero card={card} />
      <section>
        <h2>Actividad reciente</h2>
        {activity.isPending ? (
          <PageLoader />
        ) : activity.isError ? (
          <ErrorState
            title="No pudimos cargar la actividad"
            message={message(activity.error)}
            onRetry={() => void activity.refetch()}
          />
        ) : activity.data?.length ? (
          <div className={styles.list}>
            {activity.data.map((item) => (
              <Card className={styles.row} key={item.id}>
                <div>
                  <strong>{item.description}</strong>
                  <small>
                    {item.type === 'PURCHASE'
                      ? 'Compra'
                      : item.type === 'CASH_ADVANCE'
                        ? 'Adelanto de tarjeta'
                        : item.type === 'PAYMENT'
                          ? 'Pago'
                          : 'Movimiento'}{' '}
                    · {calendarDate(item.occurredAt)}
                  </small>
                </div>
                <strong className={styles.amount}>
                  {item.type === 'PAYMENT' ? '+' : '-'}
                  {money(item.amount, card.currency)}
                </strong>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin actividad reciente"
            message="Compras, avances y pagos aparecerán aquí sin mezclarse entre sí."
          />
        )}
      </section>
      <section>
        <h2>Compras</h2>
        {purchases.isPending ? (
          <PageLoader />
        ) : purchases.isError ? (
          <ErrorState
            title="No pudimos cargar las compras"
            message={message(purchases.error)}
            onRetry={() => void purchases.refetch()}
          />
        ) : purchases.data?.length ? (
          <div className={styles.list}>
            {purchases.data.map((purchase) => (
              <Card className={styles.row} key={purchase.id}>
                <div>
                  <strong>{purchase.transaction.description}</strong>{' '}
                  {purchase.trackingStatus === 'ESTIMATED' && (
                    <Badge tone="neutral">Estimado</Badge>
                  )}
                  <small>
                    {calendarDate(purchase.transaction.occurredAt)} ·{' '}
                    {purchase.installmentCount === 1
                      ? 'Una cuota'
                      : `${purchase.installmentCount} cuotas`}
                  </small>
                </div>
                <div className={styles.amount}>
                  <strong>
                    {money(purchase.transaction.amount, card.currency)}
                  </strong>
                  <span>
                    Saldo estimado{' '}
                    {money(purchase.outstandingBalance, card.currency)}
                  </span>
                </div>
                {purchase.installments.length > 0 && (
                  <small>
                    Cuota estimada{' '}
                    {purchase.installments.find(
                      (installment) => installment.status !== 'PAID',
                    )?.installmentNumber ?? purchase.installmentCount}
                    /{purchase.installmentCount}
                  </small>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin compras registradas"
            message="Las compras de esta tarjeta aparecerán aquí con sus cuotas."
          />
        )}
      </section>
      <section>
        <h2>Extractos</h2>
        {statements.isPending ? (
          <PageLoader />
        ) : statements.isError ? (
          <ErrorState
            title="No pudimos cargar los extractos"
            message={message(statements.error)}
            onRetry={() => void statements.refetch()}
          />
        ) : statements.data?.length ? (
          <div className={styles.list}>
            {statements.data.map((s) => (
              <Card className={styles.row} key={s.id}>
                <div>
                  <strong>
                    {calendarDate(s.periodStart)} – {calendarDate(s.periodEnd)}
                  </strong>
                  <small>
                    Vence {calendarDate(s.dueDate)} · Pago mínimo{' '}
                    {money(s.minimumPayment, card.currency)}
                  </small>
                </div>
                <div className={styles.amount}>
                  <strong>
                    {money(
                      s.reportedBalance ?? s.calculatedBalance,
                      card.currency,
                    )}
                  </strong>
                  <Badge tone={statusTone(s.status)}>
                    {statusLabel[s.status]}
                  </Badge>
                  {s.status !== 'PAID' && (
                    <Button
                      size="small"
                      onClick={() => {
                        setSelected(s)
                        setMode('payMonth')
                      }}
                    >
                      Pagar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin extractos"
            message="Fynar seguirá estimando el próximo pago. Actualiza esta sección cuando recibas el extracto del banco."
          />
        )}
      </section>
      <Dialog
        open={mode === 'edit'}
        title="Editar tarjeta"
        onClose={() => setMode(null)}
      >
        <EditCardForm w={w!.id} card={card} close={() => setMode(null)} />
      </Dialog>
      <Dialog
        open={mode === 'advance'}
        title="Registrar avance"
        onClose={() => setMode(null)}
      >
        <CashAdvanceForm
          w={w!.id}
          timezone={w!.timezone}
          card={card}
          close={() => setMode(null)}
        />
      </Dialog>
      <Dialog
        open={mode === 'purchase'}
        title="Registrar compra"
        onClose={() => setMode(null)}
      >
        <PurchaseForm
          w={w!.id}
          timezone={w!.timezone}
          card={card}
          close={() => setMode(null)}
        />
      </Dialog>
      <Dialog
        open={mode === 'nextPayment'}
        title="Actualizar próximo pago"
        onClose={() => setMode(null)}
      >
        <NextPaymentForm w={w!.id} card={card} close={() => setMode(null)} />
      </Dialog>
      <Dialog
        open={mode === 'statement'}
        title="Registrar extracto del banco"
        onClose={() => setMode(null)}
      >
        <StatementForm w={w!.id} card={card} close={() => setMode(null)} />
      </Dialog>
      <Dialog
        open={mode === 'payMonth' || mode === 'contribution'}
        title={mode === 'payMonth' ? 'Pagar mes' : 'Abonar a tarjeta'}
        onClose={() => setMode(null)}
      >
        <CardPaymentForm
          w={w!.id}
          timezone={w!.timezone}
          card={card}
          statement={selected}
          paymentMode={mode === 'payMonth' ? 'month' : 'contribution'}
          close={() => setMode(null)}
        />
      </Dialog>
    </div>
  )
}
function EditCardForm({
  w,
  card,
  close,
}: {
  w: string
  card: CardType
  close: () => void
}) {
  const mutate = useLiabilityMutation(w, (input: Record<string, unknown>) =>
    liabilitiesApi.updateCard(w, card.id, input),
  )
  return (
    <SimpleForm
      mutate={mutate}
      close={close}
      submit={(form) => ({
        name: String(form.get('name')),
        institutionName: String(form.get('institutionName') || '') || null,
        creditLimit: String(form.get('creditLimit')),
        billingDay: form.get('billingDay')
          ? Number(form.get('billingDay'))
          : null,
        paymentDueDay: form.get('paymentDueDay')
          ? Number(form.get('paymentDueDay'))
          : null,
        referencePeriodicRate:
          String(form.get('referencePeriodicRate') || '') || null,
        referenceRateSource: form.get('referencePeriodicRate')
          ? 'INFORMED'
          : null,
      })}
    >
      <FormField label="Nombre" htmlFor="edit-card-name">
        <Input
          id="edit-card-name"
          name="name"
          defaultValue={card.name}
          required
        />
      </FormField>
      <FormField label="Entidad" htmlFor="edit-card-bank">
        <Input
          id="edit-card-bank"
          name="institutionName"
          defaultValue={card.institutionName ?? ''}
        />
      </FormField>
      <FormField label="Cupo total" htmlFor="edit-card-limit">
        <MoneyInput
          id="edit-card-limit"
          name="creditLimit"
          minorUnits
          defaultValue={card.creditLimit ?? ''}
          required
        />
      </FormField>
      <FormField label="Día de corte" htmlFor="edit-card-billing">
        <Input
          id="edit-card-billing"
          name="billingDay"
          type="number"
          min="1"
          max="31"
          defaultValue={card.billingDay ?? ''}
        />
      </FormField>
      <FormField label="Día máximo de pago" htmlFor="edit-card-due">
        <Input
          id="edit-card-due"
          name="paymentDueDay"
          type="number"
          min="1"
          max="31"
          defaultValue={card.paymentDueDay ?? ''}
        />
      </FormField>
      <FormField
        label="Tasa mensual de referencia (opcional)"
        htmlFor="edit-card-rate"
      >
        <Input
          id="edit-card-rate"
          name="referencePeriodicRate"
          inputMode="decimal"
          defaultValue={card.referencePeriodicRate ?? ''}
        />
      </FormField>
      <p>
        Cambiar la tasa de referencia no modifica compras históricas; cada
        compra conserva la tasa aplicada al registrarse.
      </p>
    </SimpleForm>
  )
}
function CardHero({ card }: { card: CardType }) {
  return (
    <Card className={styles.heroCard}>
      <span>Cupo utilizado</span>
      <strong>{money(card.usedCredit, card.currency)}</strong>
      <span>
        de {money(card.creditLimit, card.currency)} · {card.utilization}%
      </span>
      <progress max="100" value={Number(card.utilization)} />
      <Metric
        label="Disponible"
        value={money(card.availableCredit, card.currency)}
      />
      <div className={styles.cardCycle}>
        <Metric
          label="Próximo corte"
          value={shortCalendarDate(card.nextBillingDate)}
        />
        <Metric
          label="Próximo pago"
          value={shortCalendarDate(card.nextPaymentDate)}
        />
        <Metric
          label="Tasa de referencia"
          value={
            card.referencePeriodicRate
              ? `${card.referencePeriodicRate}% mensual`
              : 'Sin informar'
          }
        />
      </div>
      {card.nextPayment && (
        <div className={styles.paymentEstimate}>
          <span>
            {card.nextPayment.source === 'INFORMED'
              ? 'Extracto informado'
              : 'Pago estimado'}
          </span>
          <strong>
            {card.nextPayment.source === 'ESTIMATED' && '≈ '}
            {money(card.nextPayment.amount, card.currency)}
          </strong>
          {card.nextPayment.source === 'ESTIMATED' && (
            <small>
              Saldo estimado del periodo. Puede cambiar cuando recibas el
              extracto del banco; el pago mínimo está por confirmar.
            </small>
          )}
        </div>
      )}
    </Card>
  )
}
function CashAdvanceForm({
  w,
  timezone,
  card,
  close,
}: {
  w: string
  timezone: string
  card: CardType
  close: () => void
}) {
  const accounts = useAccounts(w)
  const mutate = useLiabilityMutation(w, (input: CardCashAdvanceInput) =>
    liabilitiesApi.cashAdvance(w, card.id, input),
  )
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        mutate.mutate(
          {
            destinationAccountId: String(data.get('destinationAccountId')),
            amount: String(data.get('amount')),
            feeAmount: String(data.get('feeAmount') || '0'),
            occurredAt: workspaceDateTimeToIso(
              String(data.get('occurredAt')),
              timezone,
            ),
            ...(data.get('periodicRate')
              ? { periodicRate: String(data.get('periodicRate')) }
              : {}),
            ...(data.get('installmentCount')
              ? { installmentCount: Number(data.get('installmentCount')) }
              : {}),
            notes: String(data.get('notes') || ''),
            idempotencyKey: idempotency(),
          },
          { onSuccess: close },
        )
      }}
    >
      <p>
        Un avance aumenta el saldo de la tarjeta y deposita el dinero en la
        cuenta elegida. No se registra como ingreso.
      </p>
      <FormField label="Monto retirado" htmlFor="advance-amount">
        <MoneyInput id="advance-amount" name="amount" minorUnits required />
      </FormField>
      <FormField
        label="Cuenta donde recibiste el dinero"
        htmlFor="advance-account"
      >
        <Select id="advance-account" name="destinationAccountId" required>
          {accounts.data
            ?.filter(
              (a) => a.nature === 'ASSET' && a.currency === card.currency,
            )
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
        </Select>
      </FormField>
      <FormField label="Fecha" htmlFor="advance-date">
        <Input
          id="advance-date"
          name="occurredAt"
          type="datetime-local"
          defaultValue={nowInWorkspace(timezone)}
          required
        />
      </FormField>
      <FormField label="Comisión conocida" htmlFor="advance-fee">
        <MoneyInput
          id="advance-fee"
          name="feeAmount"
          defaultValue="0"
          minorUnits
        />
      </FormField>
      <FormField label="Tasa (opcional)" htmlFor="advance-rate">
        <Input id="advance-rate" name="periodicRate" inputMode="decimal" />
      </FormField>
      <FormField label="Número de cuotas" htmlFor="advance-installments">
        <Input
          id="advance-installments"
          name="installmentCount"
          type="number"
          min="1"
        />
      </FormField>
      <FormField label="Notas" htmlFor="advance-notes">
        <Textarea id="advance-notes" name="notes" />
      </FormField>
      <MutationActions
        mutation={mutate}
        close={close}
        label="Registrar avance"
      />
    </form>
  )
}
function PurchaseForm({
  w,
  timezone,
  card,
  close,
}: {
  w: string
  timezone: string
  card: CardType
  close: () => void
}) {
  const categories = useCategories(w)
  const mutate = useLiabilityMutation(w, (i: Record<string, unknown>) =>
    liabilitiesApi.purchase(w, card.id, i),
  )
  return (
    <SimpleForm
      mutate={mutate}
      close={close}
      submit={(f) => ({
        amount: String(f.get('amount')),
        description: String(f.get('description')),
        categoryId: String(f.get('categoryId')),
        occurredAt: workspaceDateTimeToIso(
          String(f.get('occurredAt')),
          timezone,
        ),
        installmentCount: Number(f.get('installmentCount')),
        periodicRate: String(f.get('periodicRate') || '0'),
        firstDueDate: String(f.get('firstDueDate')),
        idempotencyKey: idempotency(),
      })}
    >
      <FormField label="Monto" htmlFor="purchase-amount">
        <MoneyInput id="purchase-amount" name="amount" minorUnits required />
      </FormField>
      <FormField label="Descripción" htmlFor="purchase-description">
        <Input id="purchase-description" name="description" required />
      </FormField>
      <FormField label="Categoría" htmlFor="purchase-category">
        <Select id="purchase-category" name="categoryId" required>
          {categories.data
            ?.filter((c) => c.type === 'EXPENSE')
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </Select>
      </FormField>
      <FormField label="Fecha" htmlFor="purchase-date">
        <Input
          id="purchase-date"
          name="occurredAt"
          type="datetime-local"
          defaultValue={nowInWorkspace(timezone)}
          required
        />
      </FormField>
      <FormField label="Número de cuotas" htmlFor="purchase-count">
        <Input
          id="purchase-count"
          name="installmentCount"
          type="number"
          min="1"
          max="120"
          defaultValue="1"
          required
        />
      </FormField>
      <FormField label="Tasa periódica" htmlFor="purchase-rate">
        <Input
          id="purchase-rate"
          name="periodicRate"
          inputMode="decimal"
          defaultValue="0"
        />
      </FormField>
      <FormField label="Primera cuota" htmlFor="purchase-first">
        <Input
          id="purchase-first"
          name="firstDueDate"
          type="date"
          defaultValue={today()}
          required
        />
      </FormField>
    </SimpleForm>
  )
}
function NextPaymentForm({
  w,
  card,
  close,
}: {
  w: string
  card: CardType
  close: () => void
}) {
  const mutate = useLiabilityMutation(w, (input: Record<string, unknown>) =>
    liabilitiesApi.updateNextPayment(w, card.id, input),
  )
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const optionalMoney = (name: string) => {
          const value = String(form.get(name) ?? '').trim()
          return value ? { [name]: value } : {}
        }
        mutate.mutate(
          {
            amount: String(form.get('amount')),
            dueDate: String(form.get('dueDate')),
            ...optionalMoney('minimumPayment'),
          },
          { onSuccess: close },
        )
      }}
    >
      <p>
        Informa solamente lo que conoces. Esto no reemplaza el extracto completo
        del banco.
      </p>
      <FormField label="Valor del próximo pago" htmlFor="next-payment-amount">
        <MoneyInput
          id="next-payment-amount"
          name="amount"
          minorUnits
          defaultValue={
            card.nextPayment?.source === 'INFORMED'
              ? card.nextPayment.originalAmount
              : undefined
          }
          required
        />
      </FormField>
      {card.nextPayment && Number(card.nextPayment.paidAmount) > 0 && (
        <p>
          Ya pagaste {money(card.nextPayment.paidAmount, card.currency)}. La
          corrección conserva ese pago y no puede quedar por debajo de él.
        </p>
      )}
      <FormField label="Fecha máxima de pago" htmlFor="next-payment-date">
        <Input
          id="next-payment-date"
          name="dueDate"
          type="date"
          defaultValue={card.nextPaymentDate ?? undefined}
          required
        />
      </FormField>
      <FormField label="Pago mínimo (opcional)" htmlFor="next-payment-minimum">
        <MoneyInput
          id="next-payment-minimum"
          name="minimumPayment"
          minorUnits
          defaultValue={card.nextPayment?.minimumPayment ?? undefined}
        />
      </FormField>
      <MutationActions
        mutation={mutate}
        close={close}
        label="Guardar próximo pago"
      />
    </form>
  )
}
function StatementForm({
  w,
  card,
  close,
}: {
  w: string
  card: CardType
  close: () => void
}) {
  const mutate = useLiabilityMutation(w, (i: Record<string, unknown>) =>
    liabilitiesApi.createStatement(w, card.id, i),
  )
  const periodEnd = card.nextBillingDate ?? today()
  const periodStartDate = new Date(`${periodEnd}T00:00:00Z`)
  periodStartDate.setUTCMonth(periodStartDate.getUTCMonth() - 1)
  periodStartDate.setUTCDate(periodStartDate.getUTCDate() + 1)
  return (
    <SimpleForm
      mutate={mutate}
      close={close}
      submit={(f) => Object.fromEntries(f.entries())}
    >
      <p>
        El extracto es el resumen que genera tu banco al cerrar el periodo.
        Fynar ya estima el saldo; registra aquí únicamente los valores que el
        banco confirmó.
      </p>
      <FormField label="Inicio del periodo" htmlFor="st-start">
        <Input
          id="st-start"
          name="periodStart"
          type="date"
          defaultValue={periodStartDate.toISOString().slice(0, 10)}
          required
        />
      </FormField>
      <FormField label="Fin del periodo" htmlFor="st-end">
        <Input
          id="st-end"
          name="periodEnd"
          type="date"
          defaultValue={periodEnd}
          required
        />
      </FormField>
      <FormField label="Fecha límite" htmlFor="st-due">
        <Input
          id="st-due"
          name="dueDate"
          type="date"
          defaultValue={card.nextPaymentDate ?? undefined}
          required
        />
      </FormField>
      <FormField label="Saldo informado por el banco" htmlFor="st-reported">
        <MoneyInput
          id="st-reported"
          name="reportedBalance"
          minorUnits
          defaultValue={card.nextPayment?.amount ?? card.currentBalance}
        />
      </FormField>
      {['previousBalance', 'interestAmount', 'feeAmount', 'minimumPayment'].map(
        (n, i) => (
          <FormField
            key={n}
            label={['Saldo anterior', 'Intereses', 'Cargos', 'Pago mínimo'][i]}
            htmlFor={`st-${n}`}
          >
            <MoneyInput id={`st-${n}`} name={n} minorUnits required />
          </FormField>
        ),
      )}
    </SimpleForm>
  )
}
function CardPaymentForm({
  w,
  timezone,
  card,
  statement,
  paymentMode,
  close,
}: {
  w: string
  timezone: string
  card: CardType
  statement: Statement | null
  paymentMode: 'month' | 'contribution'
  close: () => void
}) {
  const accounts = useAccounts(w)
  const eligibleAccounts =
    accounts.data?.filter(
      (account) =>
        account.nature === 'ASSET' &&
        account.currency === card.currency &&
        account.isActive,
    ) ?? []
  const mutate = useLiabilityMutation(w, (i: CardPaymentInput) =>
    paymentMode === 'month' && statement
      ? liabilitiesApi.payCard(w, card.id, statement.id, i)
      : liabilitiesApi.payCardBalance(w, card.id, {
          ...i,
          applyToNextPayment: paymentMode === 'month',
        }),
  )
  const monthlyPayment = monthlyCardPayment(card, statement)
  const remaining =
    paymentMode === 'contribution'
      ? undefined
      : (monthlyPayment.amount ?? undefined)
  const [amount, setAmount] = useState(remaining ?? '')
  const expectedAmount = Number(remaining ?? 0)
  const enteredAmount = Number(amount || 0)
  const appliedAmount = Math.min(expectedAmount, enteredAmount)
  const extraAmount = Math.max(0, enteredAmount - expectedAmount)
  const pendingAmount = Math.max(0, expectedAmount - enteredAmount)
  const amountEdited = useRef(false)
  useEffect(() => {
    if (!amountEdited.current) setAmount(remaining ?? '')
  }, [remaining])
  if (accounts.isPending) return <PageLoader />
  if (accounts.isError)
    return (
      <ErrorState
        title="No pudimos cargar tus cuentas"
        message={message(accounts.error)}
        onRetry={() => void accounts.refetch()}
      />
    )
  if (eligibleAccounts.length === 0)
    return (
      <EmptyState
        title={`Necesitas una cuenta activa en ${card.currency} para pagar esta tarjeta`}
        message="Crea o activa una cuenta con la misma moneda antes de continuar."
        action={<Link to="/app/accounts">Crear cuenta</Link>}
      />
    )
  if (mutate.isSuccess) {
    const result = mutate.data.data
    return (
      <div className={styles.form} role="status">
        <h3>Pago aplicado correctamente</h3>
        <dl className={styles.details}>
          <div>
            <dt>Total pagado</dt>
            <dd>{money(result.totalAmount, card.currency)}</dd>
          </div>
          <div>
            <dt>Aplicado al mes</dt>
            <dd>{money(result.appliedToCurrentDue, card.currency)}</dd>
          </div>
          <div>
            <dt>Abono adicional</dt>
            <dd>{money(result.extraPayment, card.currency)}</dd>
          </div>
          <div>
            <dt>Deuda restante</dt>
            <dd>{money(result.newCardBalance, card.currency)}</dd>
          </div>
        </dl>
        <Button type="button" onClick={close}>
          Cerrar
        </Button>
      </div>
    )
  }
  return (
    <SimpleForm
      mutate={mutate}
      close={close}
      closeOnSuccess={false}
      submit={(f) => ({
        sourceAccountId: String(f.get('sourceAccountId')),
        amount: String(f.get('amount')),
        occurredAt: workspaceDateTimeToIso(
          String(f.get('occurredAt')),
          timezone,
        ),
        idempotencyKey: idempotency(),
      })}
    >
      <p>
        {paymentMode === 'month'
          ? 'Este pago se aplicará al próximo vencimiento pendiente.'
          : 'Este abono libre reduce la deuda total de la tarjeta.'}{' '}
        No registra un gasto nuevo porque la compra ya fue contabilizada.
      </p>
      {paymentMode === 'month' && monthlyPayment.source === 'ESTIMATED' && (
        <p role="status">
          <strong>Pago estimado: ≈ {money(remaining, card.currency)}.</strong>{' '}
          Todavía no tenemos el valor real informado por el banco. Puedes
          modificarlo antes de confirmar.
        </p>
      )}
      {paymentMode === 'month' && !remaining && (
        <p role="status">
          <strong>No conocemos todavía el valor del próximo pago.</strong>{' '}
          Ingresa el valor que deseas pagar.
        </p>
      )}
      <FormField label="Cuenta bancaria" htmlFor="card-account">
        <Select id="card-account" name="sourceAccountId" required>
          {eligibleAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField
        label={
          paymentMode === 'month' ? 'Monto que deseas pagar' : 'Valor del abono'
        }
        htmlFor="card-amount"
      >
        <MoneyInput
          id="card-amount"
          name="amount"
          minorUnits
          value={amount}
          onValueChange={(next) => {
            amountEdited.current = true
            setAmount(next)
          }}
          required
        />
      </FormField>
      {paymentMode === 'month' && remaining && enteredAmount > 0 && (
        <dl
          className={styles.details}
          aria-label="Distribución estimada del pago"
        >
          <div>
            <dt>Pago esperado este mes</dt>
            <dd>{money(remaining, card.currency)}</dd>
          </div>
          <div>
            <dt>Aplicado al mes</dt>
            <dd>{money(appliedAmount.toFixed(2), card.currency)}</dd>
          </div>
          {extraAmount > 0 && (
            <div>
              <dt>Abono adicional</dt>
              <dd>{money(extraAmount.toFixed(2), card.currency)}</dd>
            </div>
          )}
          <div>
            <dt>Quedará pendiente</dt>
            <dd>{money(pendingAmount.toFixed(2), card.currency)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{money(enteredAmount.toFixed(2), card.currency)}</dd>
          </div>
        </dl>
      )}
      <FormField label="Fecha" htmlFor="card-date">
        <Input
          id="card-date"
          name="occurredAt"
          type="datetime-local"
          defaultValue={nowInWorkspace(timezone)}
        />
      </FormField>
    </SimpleForm>
  )
}
export function ObligationDetailPage() {
  const { obligationId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { activeWorkspace: w } = useActiveWorkspace()
  const q = useObligations(w!.id)
  const o = q.data?.find((x) => x.id === obligationId)
  const canWrite = usePermission('debts.write')
  const [mode, setMode] = useState<'edit' | 'occurrence' | 'pay' | null>(null)
  const [selected, setSelected] = useState<Occurrence | null>(null)
  const action = searchParams.get('action')
  const requestedOccurrence = o
    ? [...o.occurrences]
        .filter(
          (occurrence) => !['PAID', 'CANCELLED'].includes(occurrence.status),
        )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
    : undefined
  const activeMode =
    mode ??
    (action === 'edit' || action === 'occurrence'
      ? action
      : action === 'pay' && requestedOccurrence
        ? 'pay'
        : null)
  const activeOccurrence = selected ?? requestedOccurrence ?? null
  const closeMode = () => {
    setMode(null)
    setSelected(null)
    setSearchParams({}, { replace: true })
  }
  if (q.isPending) return <PageLoader />
  if (!o)
    return (
      <ErrorState
        title="Obligación no encontrada"
        message="No existe o no pertenece al workspace actual."
      />
    )
  return (
    <div className={styles.page}>
      <Link to="/app/debts?tab=obligations">← Volver a pagos recurrentes</Link>
      <ModulePageHeader
        title={o.name}
        description={
          o.amountType === 'VARIABLE'
            ? 'El monto de cada periodo puede ser diferente.'
            : 'Monto fijo esperado por periodo.'
        }
        actions={
          canWrite ? (
            <>
              <Button variant="secondary" onClick={() => setMode('edit')}>
                Editar obligación
              </Button>
              <Button onClick={() => setMode('occurrence')}>
                Agregar vencimiento
              </Button>
            </>
          ) : undefined
        }
      />
      <Metric
        label="Monto esperado"
        value={money(o.expectedAmount, o.currency)}
      />
      <section>
        <h2>Periodos</h2>
        {o.occurrences.length ? (
          <div className={styles.list}>
            {o.occurrences.map((x) => (
              <Card className={styles.row} key={x.id}>
                <div>
                  <strong>{calendarDate(x.dueDate)}</strong>
                  <small>
                    Pagado {money(x.paidAmount, o.currency)} · Falta{' '}
                    {money(
                      (Number(x.amount) - Number(x.paidAmount)).toFixed(2),
                      o.currency,
                    )}
                  </small>
                </div>
                <div className={styles.amount}>
                  <strong>{money(x.amount, o.currency)}</strong>
                  <Badge tone={statusTone(x.status)}>
                    {statusLabel[x.status]}
                  </Badge>
                  {x.status !== 'PAID' && (
                    <Button
                      size="small"
                      onClick={() => {
                        setSelected(x)
                        setMode('pay')
                      }}
                    >
                      Pagar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin vencimientos"
            message="Agrega el primer periodo de esta obligación."
          />
        )}
      </section>
      <Dialog
        open={activeMode === 'edit'}
        title="Editar obligación global"
        onClose={closeMode}
      >
        <EditObligationForm
          w={w!.id}
          obligation={o}
          close={closeMode}
        />
      </Dialog>
      <Dialog
        open={activeMode === 'occurrence'}
        title="Agregar o actualizar periodo"
        onClose={closeMode}
      >
        <OccurrenceForm w={w!.id} o={o} close={closeMode} />
      </Dialog>
      <Dialog
        open={activeMode === 'pay'}
        title="Registrar pago recurrente"
        onClose={closeMode}
      >
        {activeOccurrence && (
          <OccurrencePaymentForm
            w={w!.id}
            timezone={w!.timezone}
            o={o}
            occurrence={activeOccurrence}
            close={closeMode}
          />
        )}
      </Dialog>
    </div>
  )
}
export function EditObligationForm({
  w,
  obligation,
  close,
}: {
  w: string
  obligation: Obligation
  close: () => void
}) {
  const mutate = useLiabilityMutation(w, (input: Record<string, unknown>) =>
    liabilitiesApi.updateObligation(w, obligation.id, input),
  )
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        mutate.mutate(
          {
            name: String(data.get('name')),
            description: String(data.get('description') || '') || null,
            expectedAmount: String(data.get('expectedAmount')),
            currency: String(data.get('currency')),
            amountType: String(data.get('amountType')),
            status: String(data.get('status')),
            remindersEnabled: data.get('remindersEnabled') === 'on',
          },
          { onSuccess: close },
        )
      }}
    >
      <FormField label="Nombre" htmlFor="edit-obligation-name">
        <Input
          id="edit-obligation-name"
          name="name"
          defaultValue={obligation.name}
          required
        />
      </FormField>
      <FormField label="Descripción" htmlFor="edit-obligation-description">
        <Textarea
          id="edit-obligation-description"
          name="description"
          defaultValue={obligation.description ?? ''}
        />
      </FormField>
      <FormField label="Monto esperado global" htmlFor="edit-obligation-amount">
        <MoneyInput
          id="edit-obligation-amount"
          name="expectedAmount"
          minorUnits
          defaultValue={obligation.expectedAmount}
          required
        />
      </FormField>
      <FormField label="Moneda" htmlFor="edit-obligation-currency">
        <Input
          id="edit-obligation-currency"
          name="currency"
          defaultValue={obligation.currency}
          maxLength={3}
          required
        />
      </FormField>
      <FormField label="Tipo de monto" htmlFor="edit-obligation-type">
        <Select
          id="edit-obligation-type"
          name="amountType"
          defaultValue={obligation.amountType}
        >
          <option value="FIXED">Fijo</option>
          <option value="VARIABLE">Variable</option>
        </Select>
      </FormField>
      <FormField label="Estado" htmlFor="edit-obligation-status">
        <Select
          id="edit-obligation-status"
          name="status"
          defaultValue={obligation.status}
        >
          <option value="ACTIVE">Activa</option>
          <option value="PAUSED">Pausada</option>
          <option value="COMPLETED">Completada</option>
          <option value="CANCELLED">Cancelada</option>
        </Select>
      </FormField>
      <Checkbox
        name="remindersEnabled"
        label="Recordatorios activados"
        defaultChecked={obligation.remindersEnabled}
      />
      <p className={styles.hint}>
        Este cambio actualiza la obligación global. Los valores históricos de
        cada periodo no se modifican.
      </p>
      <MutationActions
        mutation={mutate}
        close={close}
        label="Guardar cambios"
      />
    </form>
  )
}
function OccurrenceForm({
  w,
  o,
  close,
}: {
  w: string
  o: Obligation
  close: () => void
}) {
  const mutate = useLiabilityMutation(
    w,
    (i: { dueDate: string; amount?: string }) =>
      liabilitiesApi.occurrence(w, o.id, i),
  )
  return (
    <SimpleForm
      mutate={mutate}
      close={close}
      submit={(f) => ({
        dueDate: String(f.get('dueDate')),
        ...(f.get('amount') ? { amount: String(f.get('amount')) } : {}),
      })}
    >
      <FormField label="Fecha de vencimiento" htmlFor="occ-date">
        <Input id="occ-date" name="dueDate" type="date" required />
      </FormField>
      <FormField
        label={o.amountType === 'VARIABLE' ? 'Valor de este periodo' : 'Valor'}
        htmlFor="occ-amount"
      >
        <MoneyInput
          id="occ-amount"
          name="amount"
          minorUnits
          defaultValue={o.expectedAmount}
        />
      </FormField>
    </SimpleForm>
  )
}
function OccurrencePaymentForm({
  w,
  timezone,
  o,
  occurrence,
  close,
}: {
  w: string
  timezone: string
  o: Obligation
  occurrence: Occurrence
  close: () => void
}) {
  const accounts = useAccounts(w)
  const mutate = useLiabilityMutation(w, (i: Record<string, unknown>) =>
    liabilitiesApi.payOccurrence(w, o.id, occurrence.id, i),
  )
  return (
    <SimpleForm
      mutate={mutate}
      close={close}
      submit={(f) => ({
        accountId: String(f.get('accountId')),
        amount: String(f.get('amount')),
        occurredAt: workspaceDateTimeToIso(
          String(f.get('occurredAt')),
          timezone,
        ),
        idempotencyKey: idempotency(),
      })}
    >
      <FormField label="Cuenta pagadora" htmlFor="op-account">
        <Select id="op-account" name="accountId">
          {accounts.data
            ?.filter((a) => a.nature === 'ASSET' && a.currency === o.currency)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
        </Select>
      </FormField>
      <FormField label="Monto" htmlFor="op-amount">
        <MoneyInput
          id="op-amount"
          name="amount"
          minorUnits
          defaultValue={(
            Number(occurrence.amount) - Number(occurrence.paidAmount)
          ).toFixed(2)}
        />
      </FormField>
      <FormField label="Fecha" htmlFor="op-date">
        <Input
          id="op-date"
          name="occurredAt"
          type="datetime-local"
          defaultValue={nowInWorkspace(timezone)}
        />
      </FormField>
    </SimpleForm>
  )
}
function SimpleForm<T>({
  mutate,
  submit,
  close,
  children,
  closeOnSuccess = true,
}: {
  mutate: ReturnType<typeof useLiabilityMutation<T>>
  submit: (f: FormData) => T
  close: () => void
  children: React.ReactNode
  closeOnSuccess?: boolean
}) {
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        mutate.mutate(submit(new FormData(e.currentTarget)), {
          onSuccess: () => {
            if (closeOnSuccess) close()
          },
        })
      }}
    >
      {children}
      <MutationActions mutation={mutate} close={close} label="Confirmar" />
    </form>
  )
}
export function MutationActions<T>({
  mutation,
  close,
  label,
}: {
  mutation: ReturnType<typeof useLiabilityMutation<T>>
  close: () => void
  label: string
}) {
  return (
    <>
      {mutation.error && (
        <p className={styles.error} role="alert">
          {message(mutation.error)}
        </p>
      )}
      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          disabled={mutation.isPending}
          onClick={close}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {label}
        </Button>
      </div>
    </>
  )
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </Card>
  )
}
