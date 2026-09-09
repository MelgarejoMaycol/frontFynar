import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Button,
  FormField,
  Input,
  MoneyInput,
  Select,
  Textarea,
} from '@/components/ui'
import { canonicalMoneyInput } from '@/components/ui/money-input.utils'
import {
  useAssetAccounts,
  useCollectLoan,
  useLoan,
  useLoans,
} from '@/features/lending/hooks'
import {
  formatMoney,
  isoToWorkspaceDateTimeValue,
  workspaceDateTimeToIso,
} from '../transactions.format'
import { getTransactionErrorMessage } from '../transactions.errors'
import styles from './transactions.module.css'

type CollectionMode = 'INSTALLMENT' | 'CUSTOM' | 'FULL'

const pendingAmount = (total: string, paid: string) =>
  Math.max(0, Number(total) - Number(paid))

export function LoanCollectionForm({
  workspaceId,
  timezone,
  onSuccess,
  onCancel,
}: {
  workspaceId: string
  timezone: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const loans = useLoans(workspaceId, { status: 'ACTIVE' })
  const accounts = useAssetAccounts(workspaceId)
  const [loanId, setLoanId] = useState('')
  const [receivingAccountId, setReceivingAccountId] = useState('')
  const [mode, setMode] = useState<CollectionMode>('INSTALLMENT')
  const [amount, setAmount] = useState('')
  const [occurredAt, setOccurredAt] = useState(() =>
    isoToWorkspaceDateTimeValue(new Date().toISOString(), timezone),
  )
  const [notes, setNotes] = useState('')
  const loanDetail = useLoan(workspaceId, loanId)
  const collect = useCollectLoan(workspaceId, loanId)

  const activeLoans = Array.isArray(loans.data) ? loans.data : []
  const selectedLoan = activeLoans.find((loan) => loan.id === loanId)
  const compatibleAccounts = useMemo(
    () =>
      (accounts.data ?? []).filter(
        (account) =>
          account.isActive &&
          account.nature === 'ASSET' &&
          (!selectedLoan || account.currency === selectedLoan.currency),
      ),
    [accounts.data, selectedLoan],
  )

  const pendingInstallments =
    loanDetail.data?.installments.filter((installment) =>
      ['PENDING', 'PARTIAL', 'OVERDUE'].includes(installment.status),
    ) ?? []
  const nextInstallment = pendingInstallments[0]
  const nextPending = nextInstallment
    ? pendingAmount(nextInstallment.totalAmount, nextInstallment.totalPaid)
    : 0
  const totalPending = loanDetail.data
    ? pendingInstallments.reduce(
        (total, installment) =>
          total + pendingAmount(installment.totalAmount, installment.totalPaid),
        0,
      )
    : selectedLoan
      ? Math.max(
          0,
          Number(selectedLoan.expectedTotal) -
            Number(selectedLoan.principalReceived) -
            Number(selectedLoan.interestReceived),
        )
      : 0

  useEffect(() => {
    setMode('INSTALLMENT')
    setAmount('')
  }, [loanId])

  useEffect(() => {
    if (!selectedLoan) {
      setReceivingAccountId('')
      return
    }
    if (
      receivingAccountId &&
      compatibleAccounts.some((account) => account.id === receivingAccountId)
    )
      return
    setReceivingAccountId(compatibleAccounts[0]?.id ?? '')
  }, [compatibleAccounts, receivingAccountId, selectedLoan])

  useEffect(() => {
    if (!loanId || loanDetail.isPending) return
    if (mode === 'INSTALLMENT')
      setAmount(nextPending > 0 ? nextPending.toFixed(2) : '')
    if (mode === 'FULL')
      setAmount(totalPending > 0 ? totalPending.toFixed(2) : '')
  }, [loanDetail.isPending, loanId, mode, nextPending, totalPending])

  const numericAmount = Number(canonicalMoneyInput(amount || '0'))
  const exceedsPending = totalPending > 0 && numericAmount > totalPending + 0.005
  const canSubmit =
    Boolean(loanId && receivingAccountId) &&
    numericAmount > 0 &&
    !exceedsPending &&
    !collect.isPending &&
    !loanDetail.isPending

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    collect.mutate(
      {
        receivingAccountId,
        amount: canonicalMoneyInput(amount),
        occurredAt: workspaceDateTimeToIso(occurredAt, timezone),
        notes: notes.trim() || null,
        idempotencyKey: crypto.randomUUID(),
      },
      { onSuccess },
    )
  }

  if (loans.isPending || accounts.isPending)
    return <p role="status">Cargando préstamos y cuentas…</p>
  if (loans.isError || accounts.isError)
    return (
      <p role="alert">
        No fue posible cargar los préstamos o las cuentas disponibles.
      </p>
    )
  if (!activeLoans.length)
    return (
      <div className={styles.form}>
        <p>No tienes préstamos activos pendientes de cobro.</p>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cerrar
          </Button>
        </div>
      </div>
    )

  return (
    <form className={styles.form} onSubmit={submit}>
      {collect.isError ? (
        <p role="alert">{getTransactionErrorMessage(collect.error)}</p>
      ) : null}

      <FormField label="Préstamo que te pagaron" htmlFor="loan-collection-loan" required>
        <Select
          id="loan-collection-loan"
          value={loanId}
          onChange={(event) => {
            collect.reset()
            setLoanId(event.target.value)
          }}
          required
        >
          <option value="">Selecciona un préstamo</option>
          {activeLoans.map((loan) => (
            <option key={loan.id} value={loan.id}>
              {loan.personName} · capital pendiente{' '}
              {formatMoney(loan.currentPrincipal, loan.currency)}
            </option>
          ))}
        </Select>
      </FormField>

      {selectedLoan ? (
        <div className={styles.specializedSummary} role="status">
          <strong>Préstamo a {selectedLoan.personName}</strong>
          <span>
            Capital pendiente:{' '}
            {formatMoney(selectedLoan.currentPrincipal, selectedLoan.currency)}
          </span>
          <span>
            Total pendiente según el plan:{' '}
            {formatMoney(String(totalPending), selectedLoan.currency)}
          </span>
          {nextInstallment ? (
            <span>
              Próxima cuota: {formatMoney(String(nextPending), selectedLoan.currency)} · vence{' '}
              {new Date(`${nextInstallment.dueDate}T12:00:00`).toLocaleDateString('es-CO')}
            </span>
          ) : null}
        </div>
      ) : null}

      {selectedLoan ? (
        <FormField label="¿Qué pago recibiste?" htmlFor="loan-collection-mode" required>
          <Select
            id="loan-collection-mode"
            value={mode}
            onChange={(event) => {
              const nextMode = event.target.value as CollectionMode
              setMode(nextMode)
              if (nextMode === 'CUSTOM') setAmount('')
            }}
          >
            <option value="INSTALLMENT" disabled={!nextInstallment}>
              Cuota pendiente
            </option>
            <option value="CUSTOM">Otro abono o pago parcial</option>
            <option value="FULL">Todo lo pendiente según el plan</option>
          </Select>
        </FormField>
      ) : null}

      {selectedLoan ? (
        <FormField label="Cuenta donde recibiste el dinero" htmlFor="loan-collection-account" required>
          <Select
            id="loan-collection-account"
            value={receivingAccountId}
            onChange={(event) => setReceivingAccountId(event.target.value)}
            required
          >
            <option value="">Selecciona una cuenta</option>
            {compatibleAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · saldo {formatMoney(account.currentBalance, account.currency)}
              </option>
            ))}
          </Select>
          {!compatibleAccounts.length ? (
            <small role="alert">
              No hay una cuenta activa en {selectedLoan.currency} disponible para recibir este cobro.
            </small>
          ) : null}
        </FormField>
      ) : null}

      <FormField label="Monto recibido" htmlFor="loan-collection-amount" required>
        <MoneyInput
          id="loan-collection-amount"
          value={amount}
          onValueChange={setAmount}
          currency={selectedLoan?.currency}
          minorUnits
          disabled={!selectedLoan || mode === 'FULL'}
          placeholder="0,00"
        />
        {selectedLoan ? (
          <small>
            {mode === 'INSTALLMENT'
              ? 'Se propone el saldo de la próxima cuota. Puedes modificarlo si fue un pago parcial.'
              : mode === 'CUSTOM'
                ? 'Escribe cualquier abono recibido. Puede cubrir parcialmente una cuota o varias cuotas.'
                : 'Se usará el total pendiente del plan de pagos.'}
          </small>
        ) : null}
      </FormField>

      {exceedsPending && selectedLoan ? (
        <p role="alert">
          El cobro supera el total pendiente. Máximo:{' '}
          {formatMoney(String(totalPending), selectedLoan.currency)}.
        </p>
      ) : null}

      {selectedLoan ? (
        <div className={styles.specializedSummary}>
          <strong>Cómo se aplicará</strong>
          <small>
            El cobro se aplica desde la cuota pendiente más antigua. Dentro de cada cuota se cubre primero el interés programado y después el capital. El dinero aumenta la cuenta que selecciones y el saldo por cobrar del préstamo se reduce automáticamente.
          </small>
        </div>
      ) : null}

      <FormField label="Fecha y hora del pago" htmlFor="loan-collection-date" required>
        <Input
          id="loan-collection-date"
          type="datetime-local"
          value={occurredAt}
          onChange={(event) => setOccurredAt(event.target.value)}
          required
        />
      </FormField>

      <FormField label="Notas" htmlFor="loan-collection-notes">
        <Textarea
          id="loan-collection-notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ej. Pagó la cuota por transferencia"
        />
      </FormField>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={collect.isPending} disabled={!canSubmit}>
          Registrar cobro
        </Button>
      </div>
    </form>
  )
}
