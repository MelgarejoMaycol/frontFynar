import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  Button,
  FormField,
  Input,
  MoneyInput,
  Select,
  Textarea,
} from '@/components/ui'
import { useAccounts } from '@/features/accounts/hooks/accounts.hooks'
import { CategorySelector } from '@/features/categories/components/CategorySelector'
import {
  transactionFormSchema,
  type TransactionFormValues,
} from '../schemas/transaction.schemas'
import { getTransactionErrorMessage } from '../transactions.errors'
import {
  isoToWorkspaceDateTimeValue,
  workspaceDateTimeToIso,
} from '../transactions.format'
import type {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from '../types/transaction.types'
import styles from './transactions.module.css'

const labels = {
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
  TRANSFER: 'Transferencia',
} as const
const nullable = (value: string) => value || null

export function TransactionForm({
  workspaceId,
  timezone,
  transaction,
  pending,
  error,
  onSubmit,
  onCancel,
  initialAccountId,
}: {
  workspaceId: string
  timezone: string
  transaction?: Transaction
  pending: boolean
  error: unknown
  onSubmit: (input: CreateTransactionInput | UpdateTransactionInput) => void
  onCancel: () => void
  initialAccountId?: string
}) {
  const accounts = useAccounts(workspaceId)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type:
        transaction?.type === 'ADJUSTMENT'
          ? 'EXPENSE'
          : (transaction?.type ?? 'EXPENSE'),
      amount: transaction?.amount ?? '',
      accountId: transaction?.accountId ?? initialAccountId ?? '',
      destinationAccountId: transaction?.destinationAccountId ?? '',
      categoryId: transaction?.categoryId ?? '',
      occurredAt: transaction
        ? isoToWorkspaceDateTimeValue(transaction.occurredAt, timezone)
        : isoToWorkspaceDateTimeValue(new Date().toISOString(), timezone),
      description: transaction?.description ?? '',
      notes: transaction?.notes ?? '',
      merchantName: transaction?.merchantName ?? '',
    },
  })
  const type = useWatch({ control, name: 'type' })
  const sourceId = useWatch({ control, name: 'accountId' })
  const activeAccounts = (accounts.data ?? []).filter(
    (account) => account.isActive,
  )
  const submit = (value: TransactionFormValues) => {
    const common = {
      accountId: value.accountId,
      categoryId: value.categoryId,
      amount: value.amount,
      occurredAt: workspaceDateTimeToIso(value.occurredAt, timezone),
      description: nullable(value.description),
      notes: nullable(value.notes),
      merchantName: nullable(value.merchantName),
    }
    if (transaction)
      onSubmit({
        ...common,
        ...(value.type === 'TRANSFER'
          ? { destinationAccountId: value.destinationAccountId }
          : {}),
        version: transaction.version,
      })
    else if (value.type === 'TRANSFER')
      onSubmit({
        ...common,
        type: value.type,
        destinationAccountId: value.destinationAccountId,
      })
    else onSubmit({ ...common, type: value.type })
  }
  return (
    <form
      className={styles.form}
      onSubmit={(event) => void handleSubmit(submit)(event)}
    >
      {error != null && <p role="alert">{getTransactionErrorMessage(error)}</p>}
      <FormField
        label="Tipo"
        htmlFor="transaction-type"
        required
        error={errors.type?.message}
      >
        <Select
          id="transaction-type"
          disabled={Boolean(transaction)}
          {...register('type')}
        >
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField
        label="Monto"
        htmlFor="transaction-amount"
        required
        error={errors.amount?.message}
      >
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <MoneyInput
              id="transaction-amount"
              autoFocus
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
      </FormField>
      <FormField
        label={type === 'TRANSFER' ? 'Cuenta origen' : 'Cuenta'}
        htmlFor="transaction-account"
        required
        error={errors.accountId?.message}
      >
        <Select id="transaction-account" {...register('accountId')}>
          <option value="">Selecciona una cuenta</option>
          {activeAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} · {account.currency}
            </option>
          ))}
        </Select>
      </FormField>
      {type === 'TRANSFER' && (
        <FormField
          label="Cuenta destino"
          htmlFor="transaction-destination"
          required
          error={errors.destinationAccountId?.message}
        >
          <Select
            id="transaction-destination"
            {...register('destinationAccountId')}
          >
            <option value="">Selecciona una cuenta</option>
            {activeAccounts
              .filter((account) => account.id !== sourceId)
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {account.currency}
                </option>
              ))}
          </Select>
        </FormField>
      )}
      <Controller
        control={control}
        name="categoryId"
        render={({ field }) => (
          <CategorySelector
            workspaceId={workspaceId}
            type={type}
            value={field.value}
            onChange={field.onChange}
            disabled={pending}
            error={errors.categoryId?.message}
          />
        )}
      />
      <FormField
        label="Fecha y hora"
        htmlFor="transaction-date"
        required
        error={errors.occurredAt?.message}
      >
        <Input
          id="transaction-date"
          type="datetime-local"
          {...register('occurredAt')}
        />
      </FormField>
      <FormField
        label="Descripción"
        htmlFor="transaction-description"
        error={errors.description?.message}
      >
        <Input id="transaction-description" {...register('description')} />
      </FormField>
      <FormField
        label="Comercio"
        htmlFor="transaction-merchant"
        error={errors.merchantName?.message}
      >
        <Input id="transaction-merchant" {...register('merchantName')} />
      </FormField>
      <FormField
        label="Notas"
        htmlFor="transaction-notes"
        error={errors.notes?.message}
      >
        <Textarea id="transaction-notes" {...register('notes')} />
      </FormField>
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={pending} disabled={pending}>
          {transaction ? 'Guardar cambios' : 'Registrar movimiento'}
        </Button>
      </div>
    </form>
  )
}
