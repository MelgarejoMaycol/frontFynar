import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  Button,
  FormField,
  Input,
  MoneyInput,
  Select,
} from '@/components/ui'
import { canonicalMoneyInput } from '@/components/ui/money-input.utils'
import { useTransactions } from '@/features/transactions/hooks/transactions.hooks'
import {
  formatMoney,
  formatTransactionDate,
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
  const movements = useTransactions(
    workspaceId,
    {
      accountId: goal.account?.id,
      status: 'CONFIRMED',
      page: 1,
      limit: 50,
    },
    mode === 'CONTRIBUTE' && Boolean(goal.account?.id),
  )
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      amount: '',
      contributedAt: isoToWorkspaceDateTimeValue(
        new Date().toISOString(),
        timezone,
      ),
      transactionId: '',
    },
  })
  const transactionId = useWatch({ control, name: 'transactionId' })
  const transactionField = register('transactionId')

  const eligibleMovements = (movements.data?.items ?? []).filter(
    (movement) =>
      movement.status === 'CONFIRMED' &&
      goal.account != null &&
      ((movement.type === 'INCOME' && movement.accountId === goal.account.id) ||
        (movement.type === 'TRANSFER' &&
          movement.destinationAccountId === goal.account.id)),
  )

  const selectedMovement = eligibleMovements.find(
    (movement) => movement.id === transactionId,
  )

  return (
    <form
      className={styles.form}
      onSubmit={(event) =>
        void handleSubmit((values) => {
          const amount = canonicalMoneyInput(values.amount)
          onSubmit({
            amount: mode === 'WITHDRAW' ? `-${amount}` : amount,
            contributedAt: workspaceDateTimeToIso(values.contributedAt, timezone),
            transactionId:
              mode === 'CONTRIBUTE' && values.transactionId
                ? values.transactionId
                : null,
          })
        })(event)
      }
    >
      <div className={styles.formIntro}>
        <strong>
          {mode === 'CONTRIBUTE'
            ? 'Registrar dinero destinado a esta meta'
            : 'Liberar dinero de la meta'}
        </strong>
        <p>
          {mode === 'CONTRIBUTE'
            ? 'El aporte aumenta el avance de la meta, pero no modifica por sí solo el saldo de tu cuenta.'
            : 'El retiro reduce únicamente lo asignado a la meta; no crea un ingreso ni cambia el saldo de la cuenta.'}
        </p>
      </div>

      {error != null && <p role="alert">{getGoalErrorMessage(error)}</p>}

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

      {mode === 'CONTRIBUTE' && goal.account && (
        <FormField
          label="Movimiento real relacionado"
          htmlFor="goal-contribution-transaction"
          helpText="Opcional. Úsalo si este ahorro proviene de un ingreso o una transferencia que ya llegó a la cuenta asociada."
        >
          <Select
            id="goal-contribution-transaction"
            {...transactionField}
            onChange={(event) => {
              void transactionField.onChange(event)
              const movement = eligibleMovements.find(
                (item) => item.id === event.target.value,
              )
              if (movement)
                setValue('amount', movement.amount, { shouldDirty: true })
            }}
          >
            <option value="">Sin vincular movimiento</option>
            {eligibleMovements.map((movement) => (
              <option key={movement.id} value={movement.id}>
                {formatTransactionDate(movement.occurredAt, timezone)} ·{' '}
                {formatMoney(movement.amount, movement.currency)} ·{' '}
                {movement.description ||
                  (movement.type === 'TRANSFER' ? 'Transferencia' : 'Ingreso')}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      {mode === 'CONTRIBUTE' &&
        goal.account &&
        movements.isSuccess &&
        eligibleMovements.length === 0 && (
          <div className={styles.notice}>
            <strong>No hay movimientos de entrada recientes para vincular.</strong>
            <span>
              Puedes registrar el aporte igualmente como una asignación interna.
            </span>
          </div>
        )}

      {selectedMovement && (
        <div className={styles.notice}>
          <strong>Movimiento vinculado</strong>
          <span>
            {formatMoney(selectedMovement.amount, selectedMovement.currency)} recibido
            en {goal.account?.name}.
          </span>
        </div>
      )}

      {mode === 'WITHDRAW' && (
        <div className={styles.notice}>
          <strong>Disponible en la meta</strong>
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
        <Button type="submit" loading={pending} disabled={pending}>
          {mode === 'CONTRIBUTE' ? 'Registrar aporte' : 'Registrar retiro'}
        </Button>
      </div>
    </form>
  )
}
