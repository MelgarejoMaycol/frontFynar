import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Pencil, Trash2 } from 'lucide-react'
import {
  Button,
  ConfirmDeleteDialog,
  Dialog,
  MoneyInput,
} from '@/components/ui'
import type { Account } from '@/features/accounts/types/account.types'
import {
  formatMoney,
  isoToWorkspaceDateTimeValue,
  workspaceDateTimeToIso,
} from '@/features/transactions/transactions.format'
import {
  useDeleteInvestmentContribution,
  useDeleteInvestmentValuation,
  useDeleteInvestmentWithdrawal,
  useUpdateInvestmentContribution,
  useUpdateInvestmentValuation,
  useUpdateInvestmentWithdrawal,
} from './hooks'
import type { InvestmentPlan } from './types'
import styles from './investments.module.css'

type ActivityKind = 'contribution' | 'withdrawal' | 'valuation'

interface ActivityItem {
  id: string
  transactionId?: string
  kind: ActivityKind
  label: string
  amount: string
  occurredAt: string
  note: string | null
  accountId?: string
  accountName?: string
  sign: '+' | '-' | ''
}

export function InvestmentActivityList({
  workspaceId,
  timezone,
  plan,
  accounts,
  focusTransactionId,
}: {
  workspaceId: string
  timezone: string
  plan: InvestmentPlan
  accounts: Account[]
  focusTransactionId?: string
}) {
  const updateContribution = useUpdateInvestmentContribution(
    workspaceId,
    plan.id,
  )
  const deleteContribution = useDeleteInvestmentContribution(
    workspaceId,
    plan.id,
  )
  const updateWithdrawal = useUpdateInvestmentWithdrawal(workspaceId, plan.id)
  const deleteWithdrawal = useDeleteInvestmentWithdrawal(workspaceId, plan.id)
  const updateValuation = useUpdateInvestmentValuation(workspaceId, plan.id)
  const deleteValuation = useDeleteInvestmentValuation(workspaceId, plan.id)

  const [editing, setEditing] = useState<ActivityItem | null>(null)
  const [deleting, setDeleting] = useState<ActivityItem | null>(null)
  const [amount, setAmount] = useState('')
  const [occurredAt, setOccurredAt] = useState('')
  const [accountId, setAccountId] = useState('')
  const [note, setNote] = useState('')
  const openedFromQuery = useRef(false)

  const compatibleAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.isActive &&
          account.nature === 'ASSET' &&
          account.currency === plan.currency &&
          account.type !== 'LOAN' &&
          account.type !== 'INVESTMENT',
      ),
    [accounts, plan.currency],
  )

  const activity = useMemo<ActivityItem[]>(
    () =>
      [
        ...plan.recentContributions.map((entry) => ({
          id: entry.id,
          transactionId: entry.transactionId,
          kind: 'contribution' as const,
          label: 'Aporte',
          amount: entry.amount,
          occurredAt: entry.occurredAt,
          note: entry.note,
          accountId: entry.sourceAccount.id,
          accountName: entry.sourceAccount.name,
          sign: '+' as const,
        })),
        ...plan.recentWithdrawals.map((entry) => ({
          id: entry.id,
          transactionId: entry.transactionId,
          kind: 'withdrawal' as const,
          label: 'Retiro',
          amount: entry.amount,
          occurredAt: entry.occurredAt,
          note: entry.note,
          accountId: entry.destinationAccount.id,
          accountName: entry.destinationAccount.name,
          sign: '-' as const,
        })),
        ...plan.recentValuations.map((entry) => ({
          id: entry.id,
          kind: 'valuation' as const,
          label: 'Valor actualizado',
          amount: entry.value,
          occurredAt: entry.capturedAt,
          note: entry.note,
          sign: '' as const,
        })),
      ].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)),
    [plan.recentContributions, plan.recentValuations, plan.recentWithdrawals],
  )

  const openEdit = (item: ActivityItem) => {
    setEditing(item)
    setAmount(item.amount)
    setOccurredAt(isoToWorkspaceDateTimeValue(item.occurredAt, timezone))
    setAccountId(item.accountId ?? '')
    setNote(item.note ?? '')
  }

  useEffect(() => {
    if (!focusTransactionId || openedFromQuery.current) return
    const target = activity.find(
      (item) => item.transactionId === focusTransactionId,
    )
    if (!target) return
    openedFromQuery.current = true
    openEdit(target)
  }, [activity, focusTransactionId])

  const closeEdit = () => {
    setEditing(null)
    setAmount('')
    setOccurredAt('')
    setAccountId('')
    setNote('')
    updateContribution.reset()
    updateWithdrawal.reset()
    updateValuation.reset()
  }

  const updateError =
    updateContribution.error ?? updateWithdrawal.error ?? updateValuation.error
  const updatePending =
    updateContribution.isPending ||
    updateWithdrawal.isPending ||
    updateValuation.isPending

  const saveEdit = () => {
    if (!editing || !amount || !occurredAt) return
    const iso = workspaceDateTimeToIso(occurredAt, timezone)
    if (editing.kind === 'contribution') {
      if (!accountId) return
      updateContribution.mutate(
        {
          contributionId: editing.id,
          input: {
            sourceAccountId: accountId,
            amount,
            occurredAt: iso,
            note: note || null,
          },
        },
        { onSuccess: closeEdit },
      )
      return
    }
    if (editing.kind === 'withdrawal') {
      if (!accountId) return
      updateWithdrawal.mutate(
        {
          withdrawalId: editing.id,
          input: {
            destinationAccountId: accountId,
            amount,
            occurredAt: iso,
            note: note || null,
          },
        },
        { onSuccess: closeEdit },
      )
      return
    }
    updateValuation.mutate(
      {
        valuationId: editing.id,
        input: {
          value: amount,
          capturedAt: iso,
          note: note || null,
        },
      },
      { onSuccess: closeEdit },
    )
  }

  const deleteError =
    deleteContribution.error ?? deleteWithdrawal.error ?? deleteValuation.error
  const deletePending =
    deleteContribution.isPending ||
    deleteWithdrawal.isPending ||
    deleteValuation.isPending

  const confirmDelete = () => {
    if (!deleting) return
    const done = () => setDeleting(null)
    if (deleting.kind === 'contribution') {
      deleteContribution.mutate(deleting.id, { onSuccess: done })
      return
    }
    if (deleting.kind === 'withdrawal') {
      deleteWithdrawal.mutate(deleting.id, { onSuccess: done })
      return
    }
    deleteValuation.mutate(deleting.id, { onSuccess: done })
  }

  return (
    <>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Actividad de la inversión</h2>
            <p>
              Los aportes y retiros crean movimientos reales. Puedes corregir
              monto, cuenta, fecha o nota y Fynar mantiene los saldos
              sincronizados.
            </p>
          </div>
        </div>

        <div className={styles.history}>
          {activity.length === 0 ? (
            <p className={styles.helper}>
              Todavía no has registrado aportes, retiros ni actualizaciones de
              valor.
            </p>
          ) : (
            activity.map((item) => (
              <div
                key={item.kind + item.id}
                className={styles.investmentActivityItem}
              >
                <div className={styles.historyTitle}>
                  <strong>{item.label}</strong>
                  <span className={styles.historyMeta}>
                    {new Date(item.occurredAt).toLocaleString('es-CO')} 
                    {item.accountName ? ` · ${item.accountName}` : ''}
                  </span>
                  {item.transactionId ? (
                    <Link
                      className={styles.activityMovementLink}
                      to={`/app/transactions?transactionId=${item.transactionId}`}
                    >
                      Ver movimiento
                    </Link>
                  ) : null}
                </div>

                <div className={styles.activityRight}>
                  <strong
                    className={`${styles.historyAmount} ${
                      item.sign === '+'
                        ? styles.positive
                        : item.sign === '-'
                          ? styles.negative
                          : ''
                    }`}
                  >
                    {item.sign}
                    {formatMoney(item.amount, plan.currency)}
                  </strong>
                  <div className={styles.activityActions}>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={`Editar ${item.label.toLowerCase()}`}
                      onClick={() => openEdit(item)}
                    >
                      <Pencil size={15} aria-hidden="true" /> Editar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      aria-label={`Eliminar ${item.label.toLowerCase()}`}
                      onClick={() => setDeleting(item)}
                    >
                      <Trash2 size={15} aria-hidden="true" /> Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Dialog
        open={Boolean(editing)}
        title={
          editing?.kind === 'contribution'
            ? 'Editar aporte'
            : editing?.kind === 'withdrawal'
              ? 'Editar retiro'
              : 'Editar valor de inversión'
        }
        onClose={closeEdit}
        footer={
          <div className={styles.dialogActions}>
            <Button type="button" variant="ghost" onClick={closeEdit}>
              Cancelar
            </Button>
            <Button
              type="button"
              loading={updatePending}
              disabled={
                !amount ||
                !occurredAt ||
                (editing?.kind !== 'valuation' && !accountId)
              }
              onClick={saveEdit}
            >
              Guardar cambios
            </Button>
          </div>
        }
      >
        <div className={styles.form}>
          {editing?.kind !== 'valuation' ? (
            <label className={styles.field}>
              <span>
                {editing?.kind === 'contribution'
                  ? 'Cuenta de origen'
                  : 'Cuenta de destino'}
              </span>
              <select
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
              >
                <option value="">Selecciona una cuenta</option>
                {compatibleAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} · {formatMoney(
                      account.availableBalance ?? account.currentBalance,
                      account.currency,
                    )}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className={styles.field}>
            <span>
              {editing?.kind === 'valuation' ? 'Valor registrado' : 'Monto'}
            </span>
            <MoneyInput
              value={amount}
              currency={plan.currency}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Fecha y hora</span>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Nota</span>
            <textarea
              value={note}
              maxLength={500}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Opcional"
            />
          </label>

          {updateError ? (
            <p className={styles.error} role="alert">
              {updateError instanceof Error
                ? updateError.message
                : 'No pudimos guardar los cambios.'}
            </p>
          ) : null}
        </div>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title={
          deleting?.kind === 'contribution'
            ? 'Eliminar aporte'
            : deleting?.kind === 'withdrawal'
              ? 'Eliminar retiro'
              : 'Eliminar actualización de valor'
        }
        name={deleting?.label ?? 'Registro'}
        description={
          deleting?.kind === 'valuation'
            ? 'Se eliminará esta referencia de valor.'
            : 'Fynar revertirá el efecto en la cuenta y cancelará el movimiento vinculado para conservar la trazabilidad.'
        }
        pending={deletePending}
        error={
          deleteError instanceof Error ? deleteError.message : undefined
        }
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
