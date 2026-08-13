import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  FormField,
  Input,
  MoneyInput,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useAccounts } from '@/features/accounts/hooks/accounts.hooks'
import { useCategories } from '@/features/categories/hooks/categories.hooks'
import { workspaceDateTimeToIso } from '@/features/transactions/transactions.format'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { liabilitiesApi } from './api'
import {
  liabilityKeys,
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
} from './format'
import type {
  Card as CardType,
  DebtInstallment,
  Obligation,
  Occurrence,
  Statement,
} from './types'
import styles from './liabilities.module.css'
const message = (e: unknown) =>
  e instanceof Error ? e.message : 'No fue posible completar la operación.'
const today = () => new Date().toISOString().slice(0, 10),
  nowLocal = () => new Date().toISOString().slice(0, 16)
export function DebtDetailPage() {
  const { debtId = '' } = useParams()
  const { activeWorkspace: w } = useActiveWorkspace()
  const q = useDebt(w!.id, debtId)
  const canWrite = usePermission('debts.write')
  const [action, setAction] = useState<
    'pay' | 'prepay' | 'reconcile' | 'installment' | null
  >(null)
  const [selected, setSelected] = useState<DebtInstallment | null>(null)
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
    progress = Number(d.originalAmount)
      ? Math.max(0, (paid / Number(d.originalAmount)) * 100)
      : 0
  return (
    <div className={styles.page}>
      <Link to="/app/debts?tab=debts">← Volver a créditos</Link>
      <PageHeader
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
        <span>Saldo actual</span>
        <strong>{money(d.currentBalance, d.currency)}</strong>
        <progress max="100" value={progress} />
        <span>{progress.toFixed(0)}% del capital pagado</span>
        <div className={styles.metrics}>
          <Metric
            label="Monto original"
            value={money(d.originalAmount, d.currency)}
          />
          <Metric
            label="Cuota"
            value={money(d.installmentAmount, d.currency)}
          />
          <Metric
            label="Tasa"
            value={d.interestRate ? `${d.interestRate}%` : 'No informada'}
          />
          <Metric
            label="Final estimado"
            value={calendarDate(d.estimatedEndDate)}
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
                      <dt>Capital</dt>
                      <dd>{money(i.principalAmount, d.currency)}</dd>
                    </div>
                    <div>
                      <dt>Interés</dt>
                      <dd>{money(i.interestAmount, d.currency)}</dd>
                    </div>
                    <div>
                      <dt>Pagado</dt>
                      <dd>{money(i.paidAmount, d.currency)}</dd>
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
    (i: Record<string, unknown>) =>
      liabilitiesApi.payDebt(workspaceId, debtId, installment.id, i),
    liabilityKeys.debt(workspaceId, debtId),
  )
  const remaining = (
    Number(installment.totalAmount) - Number(installment.paidAmount)
  ).toFixed(2)
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
          defaultValue={remaining}
          required
        />
      </FormField>
      <FormField label="Fecha" htmlFor="pay-date">
        <Input
          id="pay-date"
          name="paidAt"
          type="datetime-local"
          defaultValue={nowLocal()}
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
                    {a.name}
                  </option>
                ))}
            </Select>
          </FormField>
          <FormField label="Fecha" htmlFor="prepay-date">
            <Input
              id="prepay-date"
              name="occurredAt"
              type="datetime-local"
              defaultValue={nowLocal()}
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
      <FormField label="Saldo informado" htmlFor="rec-balance">
        <MoneyInput
          id="rec-balance"
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
          placeholder="Banco, extracto o contrato"
          required
        />
      </FormField>
      <FormField label="Nueva cuota (opcional)" htmlFor="rec-payment">
        <MoneyInput id="rec-payment" name="newPayment" />
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
    purchases = usePurchases(w!.id, cardId)
  const card = cards.data?.find((c) => c.id === cardId)
  const [mode, setMode] = useState<'purchase' | 'statement' | 'pay' | null>(
    null,
  )
  const [selected, setSelected] = useState<Statement | null>(null)
  if (cards.isPending || statements.isPending || purchases.isPending)
    return <PageLoader />
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
      <PageHeader
        title={card.name}
        description="Compras, extractos y pagos"
        actions={
          <>
            <Button variant="secondary" onClick={() => setMode('statement')}>
              Crear extracto
            </Button>
            <Button onClick={() => setMode('purchase')}>
              Registrar compra
            </Button>
          </>
        }
      />
      <CardHero card={card} />
      <section>
        <h2>Compras</h2>
        {purchases.data?.length ? (
          <div className={styles.list}>
            {purchases.data.map((purchase) => (
              <Card className={styles.row} key={purchase.id}>
                <div>
                  <strong>{purchase.transaction.description}</strong>
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
                    Saldo {money(purchase.outstandingBalance, card.currency)}
                  </span>
                </div>
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
        {statements.data?.length ? (
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
            title="Sin extractos"
            message="Crea el primer extracto para registrar pagos de la tarjeta."
          />
        )}
      </section>
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
        open={mode === 'statement'}
        title="Crear extracto"
        onClose={() => setMode(null)}
      >
        <StatementForm w={w!.id} card={card} close={() => setMode(null)} />
      </Dialog>
      <Dialog
        open={mode === 'pay'}
        title="Pagar tarjeta"
        onClose={() => setMode(null)}
      >
        {selected && (
          <CardPaymentForm
            w={w!.id}
            timezone={w!.timezone}
            card={card}
            statement={selected}
            close={() => setMode(null)}
          />
        )}
      </Dialog>
    </div>
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
    </Card>
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
        <MoneyInput id="purchase-amount" name="amount" required />
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
          defaultValue={nowLocal()}
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
  return (
    <SimpleForm
      mutate={mutate}
      close={close}
      submit={(f) => Object.fromEntries(f)}
    >
      <FormField label="Inicio del periodo" htmlFor="st-start">
        <Input id="st-start" name="periodStart" type="date" required />
      </FormField>
      <FormField label="Fin del periodo" htmlFor="st-end">
        <Input id="st-end" name="periodEnd" type="date" required />
      </FormField>
      <FormField label="Fecha límite" htmlFor="st-due">
        <Input id="st-due" name="dueDate" type="date" required />
      </FormField>
      {['previousBalance', 'interestAmount', 'feeAmount', 'minimumPayment'].map(
        (n, i) => (
          <FormField
            key={n}
            label={['Saldo anterior', 'Intereses', 'Cargos', 'Pago mínimo'][i]}
            htmlFor={`st-${n}`}
          >
            <MoneyInput id={`st-${n}`} name={n} defaultValue="0.00" required />
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
  close,
}: {
  w: string
  timezone: string
  card: CardType
  statement: Statement
  close: () => void
}) {
  const accounts = useAccounts(w)
  const mutate = useLiabilityMutation(w, (i: Record<string, unknown>) =>
    liabilitiesApi.payCard(w, card.id, statement.id, i),
  )
  const remaining = (
    Number(statement.reportedBalance ?? statement.calculatedBalance) -
    Number(statement.paidAmount)
  ).toFixed(2)
  return (
    <SimpleForm
      mutate={mutate}
      close={close}
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
        Este pago reduce el saldo de tu tarjeta. No registra un gasto nuevo
        porque la compra ya fue contabilizada.
      </p>
      <FormField label="Cuenta bancaria" htmlFor="card-account">
        <Select id="card-account" name="sourceAccountId">
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
      <FormField label="Monto" htmlFor="card-amount">
        <MoneyInput id="card-amount" name="amount" defaultValue={remaining} />
      </FormField>
      <FormField label="Fecha" htmlFor="card-date">
        <Input
          id="card-date"
          name="occurredAt"
          type="datetime-local"
          defaultValue={nowLocal()}
        />
      </FormField>
    </SimpleForm>
  )
}
export function ObligationDetailPage() {
  const { obligationId = '' } = useParams()
  const { activeWorkspace: w } = useActiveWorkspace()
  const q = useObligations(w!.id)
  const o = q.data?.find((x) => x.id === obligationId)
  const canWrite = usePermission('debts.write')
  const [mode, setMode] = useState<'edit' | 'occurrence' | 'pay' | null>(null)
  const [selected, setSelected] = useState<Occurrence | null>(null)
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
      <PageHeader
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
        open={mode === 'edit'}
        title="Editar obligación global"
        onClose={() => setMode(null)}
      >
        <EditObligationForm
          w={w!.id}
          obligation={o}
          close={() => setMode(null)}
        />
      </Dialog>
      <Dialog
        open={mode === 'occurrence'}
        title="Agregar o actualizar periodo"
        onClose={() => setMode(null)}
      >
        <OccurrenceForm w={w!.id} o={o} close={() => setMode(null)} />
      </Dialog>
      <Dialog
        open={mode === 'pay'}
        title="Registrar pago recurrente"
        onClose={() => setMode(null)}
      >
        {selected && (
          <OccurrencePaymentForm
            w={w!.id}
            timezone={w!.timezone}
            o={o}
            occurrence={selected}
            close={() => setMode(null)}
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
          defaultValue={nowLocal()}
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
}: {
  mutate: ReturnType<typeof useLiabilityMutation<T>>
  submit: (f: FormData) => T
  close: () => void
  children: React.ReactNode
}) {
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        mutate.mutate(submit(new FormData(e.currentTarget)), {
          onSuccess: close,
        })
      }}
    >
      {children}
      <MutationActions mutation={mutate} close={close} label="Confirmar" />
    </form>
  )
}
function MutationActions<T>({
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
