import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Button, FormField, Input, MoneyInput, Select } from '@/components/ui'
import { canonicalMoneyInput } from '@/components/ui/money-input.utils'
import { useAccounts } from '@/features/accounts/hooks/accounts.hooks'
import { formatMoney } from '@/features/transactions/transactions.format'
import {
  isoToWorkspaceDateTimeValue,
  workspaceDateTimeToIso,
} from '@/features/transactions/transactions.format'
import { getGoalErrorMessage } from '../goals.errors'
import {
  contributionFormSchema,
  type ContributionFormValues,
} from '../schemas/goal.schemas'
import type { Goal, GoalContributionInput } from '../types/goal.types'
import styles from './goals.module.css'

export function ContributionForm({
  workspaceId,
  timezone,
  baseCurrency,
  goal,
  mode,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  workspaceId: string
  timezone: string
  baseCurrency: string
  goal: Goal
  mode: 'CONTRIBUTE' | 'WITHDRAW'
  pending: boolean
  error: unknown
  onSubmit: (input: GoalContributionInput) => void
  onCancel: () => void
}) {
  const accounts = useAccounts(workspaceId)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      amount: '',
      contributedAt: isoToWorkspaceDateTimeValue(
        new Date().toISOString(),
        timezone,
      ),
      accountId: goal.account?.id ?? '',
    },
  })
  const accountId = useWatch({ control, name: 'accountId' })

  const goalReservedByAccount = goal.contributions.reduce<Record<string, number>>(
    (totals, contribution) => {
      if (!contribution.accountId) return totals
      totals[contribution.accountId] =
        (totals[contribution.accountId] ?? 0) + Number(contribution.amount)
      return totals
    },
    {},
  )

  const assetAccounts = (accounts.data ?? []).filter(
    (account) => account.isActive && account.nature === 'ASSET',
  )
  const availableAccounts =
    mode === 'WITHDRAW'
      ? assetAccounts.filter(
          (account) => (goalReservedByAccount[account.id] ?? 0) > 0,
        )
      : assetAccounts
  const selectedAccount = availableAccounts.find(
    (account) => account.id === accountId,
  )
  const selectedAvailable = Number(
    selectedAccount?.availableBalance ?? selectedAccount?.currentBalance ?? 0,
  )
  const selectedGoalReserved = selectedAccount
    ? Math.max(0, goalReservedByAccount[selectedAccount.id] ?? 0)
    : 0

  return (
    <form
      className={styles.form}
      onSubmit={(event) =>
        void handleSubmit((values) => {
          const amount = canonicalMoneyInput(values.amount)
          const numericAmount = Number(amount)
          if (mode === 'CONTRIBUTE' && numericAmount > selectedAvailable) {
            setError('amount', {
              message: 'El aporte supera el dinero disponible en esta cuenta.',
            })
            return
          }
          if (mode === 'WITHDRAW' && numericAmount > selectedGoalReserved) {
            setError('amount', {
              message: 'El retiro supera lo reservado para esta meta en la cuenta.',
            })
            return
          }
          onSubmit({
            amount: mode === 'WITHDRAW' ? `-${amount}` : amount,
            contributedAt: workspaceDateTimeToIso(values.contributedAt, timezone),
            accountId: values.accountId,
          })
        })(event)
      }
    >
      <div className={styles.formIntro}>
        <strong>
          {mode === 'CONTRIBUTE'
            ? 'Reservar dinero de una cuenta para esta meta'
            : 'Liberar dinero reservado de la meta'}
        </strong>
        <p>
          {mode === 'CONTRIBUTE'
            ? 'El saldo real de la cuenta no cambia. Fynar separa este monto como dinero comprometido con la meta y reduce lo que aparece como disponible para usar.'
            : 'El dinero vuelve a quedar disponible dentro de la misma cuenta. No se crea un ingreso ni un movimiento financiero.'}
        </p>
      </div>

      {error != null && <p role="alert">{getGoalErrorMessage(error)}</p>}

      <FormField
        label={
          mode === 'CONTRIBUTE'
            ? 'Cuenta de la cual se hará el aporte'
            : 'Cuenta de la cual se liberará la reserva'
        }
        htmlFor="goal-contribution-account"
        required
        error={errors.accountId?.message}
        helpText={
          mode === 'CONTRIBUTE'
            ? 'El aporte queda relacionado con esta cuenta, pero no genera un gasto ni una transferencia.'
            : 'Solo aparecen cuentas donde esta meta tiene dinero reservado.'
        }
      >
        <Select id="goal-contribution-account" {...register('accountId')}>
          <option value="">Selecciona una cuenta</option>
          {availableAccounts.map((account) => {
            const available = account.availableBalance ?? account.currentBalance
            const reserved = account.reservedForGoals ?? '0.00'
            return (
              <option key={account.id} value={account.id}>
                {mode === 'CONTRIBUTE'
                  ? `${account.name} · Disponible ${formatMoney(available, account.currency)} · En metas ${formatMoney(reserved, account.currency)}`
                  : `${account.name} · En esta meta ${formatMoney(String(Math.max(0, goalReservedByAccount[account.id] ?? 0)), account.currency)}`}
              </option>
            )
          })}
        </Select>
      </FormField>

      {selectedAccount && (
        <div className={styles.notice}>
          <strong>
            {mode === 'CONTRIBUTE'
              ? `Disponible en ${selectedAccount.name}`
              : `Reservado en ${selectedAccount.name} para esta meta`}
          </strong>
          <span>
            {formatMoney(
              String(
                mode === 'CONTRIBUTE'
                  ? selectedAvailable
                  : selectedGoalReserved,
              ),
              selectedAccount.currency,
            )}
          </span>
          {mode === 'CONTRIBUTE' && Number(selectedAccount.reservedForGoals ?? 0) > 0 && (
            <span>
              Saldo total {formatMoney(selectedAccount.currentBalance, selectedAccount.currency)} · En metas{' '}
              {formatMoney(selectedAccount.reservedForGoals ?? '0', selectedAccount.currency)}
            </span>
          )}
        </div>
      )}

      {accounts.isSuccess && availableAccounts.length === 0 && (
        <div className={styles.notice}>
          <strong>
            {mode === 'CONTRIBUTE'
              ? 'No hay cuentas de dinero disponibles.'
              : 'Esta meta no tiene reservas atribuibles a una cuenta.'}
          </strong>
          <span>
            {mode === 'CONTRIBUTE'
              ? 'Crea o activa una cuenta de efectivo, banco, ahorro o billetera para poder aportar.'
              : 'Los aportes antiguos sin cuenta pueden requerir una corrección antes de retirarlos.'}
          </span>
        </div>
      )}

      <FormField
        label={mode === 'CONTRIBUTE' ? 'Monto del aporte' : 'Monto a retirar'}
        htmlFor="goal-contribution-amount"
        required
        error={errors.amount?.message}
      >
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <MoneyInput
              id="goal-contribution-amount"
              minorUnits
              placeholder="0,00"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
      </FormField>

      <FormField
        label="Fecha"
        htmlFor="goal-contribution-date"
        required
        error={errors.contributedAt?.message}
      >
        <Input
          id="goal-contribution-date"
          type="datetime-local"
          {...register('contributedAt')}
        />
      </FormField>

      {mode === 'WITHDRAW' && (
        <div className={styles.notice}>
          <strong>Total ahorrado en la meta</strong>
          <span>
            {formatMoney(
              goal.savedAmount,
              goal.account?.currency ?? baseCurrency,
            )}
          </span>
        </div>
      )}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={pending}
          disabled={pending || availableAccounts.length === 0}
        >
          {mode === 'CONTRIBUTE' ? 'Reservar para la meta' : 'Liberar reserva'}
        </Button>
      </div>
    </form>
  )
}
