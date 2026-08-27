import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  Button,
  FormField,
  Input,
  MoneyInput,
  Select,
  Textarea,
} from '@/components/ui'
import { canonicalMoneyInput } from '@/components/ui/money-input.utils'
import { useAccounts } from '@/features/accounts/hooks/accounts.hooks'
import { useCategories } from '@/features/categories/hooks/categories.hooks'
import { useDebt, useDebts } from '@/features/liabilities/hooks'
import {
  transactionFormSchema,
  type TransactionFormValues,
} from '../schemas/transaction.schemas'
import { getTransactionErrorMessage } from '../transactions.errors'
import {
  formatMoney,
  isoToWorkspaceDateTimeValue,
  workspaceDateTimeToIso,
} from '../transactions.format'
import type {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from '../types/transaction.types'
import styles from './transactions.module.css'
import { TransactionCategorySelector } from './TransactionCategorySelector'
import { TransactionAccountSelect } from './TransactionAccountSelect'
import {
  contextNeedsCategory,
  formContextPresentation,
  getTransactionFormContext,
} from './transaction-form.context'

const labels = {
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
  TRANSFER: 'Transferencia',
  ADVANCE: 'Adelanto',
} as const
const nullable = (value: string) => value || null
const cents = (value: string) => {
  const canonical = canonicalMoneyInput(value || '0')
  const [whole = '0', fraction = ''] = canonical.split('.')
  return (
    BigInt(whole || '0') * 100n +
    BigInt(fraction.padEnd(2, '0').slice(0, 2) || '0')
  )
}

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
    getValues,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type:
        transaction?.type === 'ADJUSTMENT' ||
        transaction?.type === 'DEBT_PAYMENT'
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
      installmentCount: 1,
      periodicRate: '',
      debtOperation: 'INSTALLMENT_PAYMENT',
      debtStrategy: 'REDUCE_TERM',
      categoryRequired: true,
    },
  })
  const type = useWatch({ control, name: 'type' })
  const sourceId = useWatch({ control, name: 'accountId' })
  const destinationId = useWatch({ control, name: 'destinationAccountId' })
  const installmentCount = useWatch({ control, name: 'installmentCount' })
  const categoryId = useWatch({ control, name: 'categoryId' })
  const amount = useWatch({ control, name: 'amount' })
  const debtOperation = useWatch({ control, name: 'debtOperation' })
  const categories = useCategories(workspaceId)
  const debts = useDebts(
    workspaceId,
    'status=ACTIVE&limit=100&sort=name&order=asc',
  )
  const debtTargetValue =
    type === 'INCOME' ? sourceId : type === 'TRANSFER' ? destinationId : ''
  const debtId = debtTargetValue.startsWith('debt:')
    ? debtTargetValue.slice(5)
    : ''
  const debtDetail = useDebt(workspaceId, debtId)
  const selectedDebt = debtId
    ? debtDetail.data?.id === debtId
      ? debtDetail.data
      : debts.data?.items.find((debt) => debt.id === debtId)
    : undefined
  const nextInstallment = selectedDebt?.debtInstallments?.find((installment) =>
    ['PENDING', 'PARTIAL', 'OVERDUE'].includes(installment.status),
  )
  const installmentPending = nextInstallment
    ? Math.max(
        0,
        Number(nextInstallment.totalAmount) -
          Number(nextInstallment.paidAmount),
      ).toFixed(2)
    : ''
  const activeAccounts = (accounts.data ?? []).filter(
    (account) => account.isActive,
  )
  const destinationAccount = activeAccounts.find(
    (account) => account.id === destinationId,
  )
  const sourceAccount = activeAccounts.find(
    (account) => account.id === sourceId,
  )
  const formContext = getTransactionFormContext({
    type,
    source: sourceAccount,
    destination: destinationAccount,
    hasDebt: Boolean(selectedDebt),
    debtOperation,
  })
  const isDebtContext =
    formContext === 'DEBT_INSTALLMENT_PAYMENT' ||
    formContext === 'DEBT_EXTRA_PAYMENT'
  const presentation = formContextPresentation(formContext)
  const showCategory = contextNeedsCategory(formContext)
  const isCardPurchase =
    type === 'EXPENSE' && sourceAccount?.type === 'CREDIT_CARD'
  const availableCredit = sourceAccount?.creditLimit
    ? Number(sourceAccount.creditLimit) - Number(sourceAccount.currentBalance)
    : 0
  const advanceExceedsCredit =
    type === 'ADVANCE' &&
    Number(canonicalMoneyInput(amount || '0')) > availableCredit
  const incomeExceedsCardDebt =
    type === 'INCOME' &&
    sourceAccount?.type === 'CREDIT_CARD' &&
    cents(amount || '0') > cents(sourceAccount.currentBalance)
  const debtAmount = Number(canonicalMoneyInput(amount || '0'))
  const debtExceedsBalance =
    Boolean(selectedDebt) &&
    debtAmount > Number(selectedDebt?.currentBalance ?? 0)
  const debtExceedsInstallment =
    formContext === 'DEBT_INSTALLMENT_PAYMENT' &&
    Boolean(installmentPending) &&
    debtAmount > Number(installmentPending)
  const isPartialInstallment =
    formContext === 'DEBT_INSTALLMENT_PAYMENT' &&
    debtAmount > 0 &&
    Boolean(installmentPending) &&
    debtAmount < Number(installmentPending)
  const debtCurrencyMismatch =
    Boolean(selectedDebt && sourceAccount) &&
    selectedDebt?.currency !== sourceAccount?.currency
  const debtInsufficientFunds =
    Boolean(selectedDebt && sourceAccount) &&
    debtAmount > Number(sourceAccount?.currentBalance ?? 0)
  const validCategories = useMemo(
    () =>
      (categories.data ?? []).filter(
        (category) => category.type === type && category.isActive,
      ),
    [categories.data, type],
  )
  const transferCategory = validCategories.find(
    (category) => type === 'TRANSFER' && category.isSystem,
  )
  const previousType = useRef(type)
  const previousDebtSuggestion = useRef('')
  useEffect(() => {
    if (previousType.current === type) return
    const oldDebtTarget =
      getValues('accountId').startsWith('debt:') ||
      getValues('destinationAccountId').startsWith('debt:')
    setValue('destinationAccountId', '', { shouldValidate: false })
    setValue('categoryId', '', { shouldValidate: false })
    setValue('debtOperation', 'INSTALLMENT_PAYMENT', { shouldValidate: false })
    setValue('debtStrategy', 'REDUCE_TERM', { shouldValidate: false })
    setValue('installmentCount', 1, { shouldValidate: false })
    setValue('periodicRate', '', { shouldValidate: false })
    setValue('merchantName', '', { shouldValidate: false })
    if (getValues('accountId').startsWith('debt:'))
      setValue('accountId', '', { shouldValidate: false })
    if (oldDebtTarget) setValue('amount', '', { shouldValidate: false })
    previousDebtSuggestion.current = ''
    previousType.current = type
  }, [getValues, setValue, type])
  useEffect(() => {
    setValue('categoryRequired', showCategory, { shouldValidate: true })
    if (type === 'TRANSFER') {
      if (transferCategory && categoryId !== transferCategory.id)
        setValue('categoryId', transferCategory.id, { shouldValidate: true })
      return
    }
    if (!showCategory) {
      if (categoryId) setValue('categoryId', '', { shouldValidate: false })
      return
    }
    if (
      categoryId &&
      !validCategories.some((category) => category.id === categoryId)
    )
      setValue('categoryId', '', { shouldValidate: false })
  }, [
    categoryId,
    setValue,
    showCategory,
    transferCategory,
    type,
    validCategories,
  ])
  useEffect(() => {
    if (!presentation.counterparty && getValues('merchantName'))
      setValue('merchantName', '', { shouldValidate: false })
  }, [getValues, presentation.counterparty, setValue])
  useEffect(() => {
    if (
      selectedDebt &&
      debtOperation === 'INSTALLMENT_PAYMENT' &&
      !debtDetail.isPending &&
      !nextInstallment
    )
      setValue('debtOperation', 'EXTRA_PAYMENT')
  }, [
    debtDetail.isPending,
    debtOperation,
    nextInstallment,
    selectedDebt,
    setValue,
  ])
  const suggestionContext = selectedDebt
    ? `${selectedDebt.id}:${nextInstallment?.id ?? 'none'}:${installmentPending}:${debtOperation}`
    : ''
  useEffect(() => {
    if (previousDebtSuggestion.current === suggestionContext) return
    const hadDebtSuggestion = Boolean(previousDebtSuggestion.current)
    if (!suggestionContext) {
      if (hadDebtSuggestion) {
        setValue('amount', '', { shouldValidate: false })
        setValue('debtOperation', 'INSTALLMENT_PAYMENT', {
          shouldValidate: false,
        })
        setValue('debtStrategy', 'REDUCE_TERM', { shouldValidate: false })
      }
    } else if (debtOperation === 'EXTRA_PAYMENT') {
      setValue('amount', '', { shouldValidate: false })
    } else if (installmentPending) {
      setValue('amount', installmentPending, { shouldValidate: true })
    }
    previousDebtSuggestion.current = suggestionContext
  }, [debtOperation, installmentPending, setValue, suggestionContext])
  const submit = (value: TransactionFormValues) => {
    const common = {
      accountId: value.accountId,
      amount: canonicalMoneyInput(value.amount),
      occurredAt: workspaceDateTimeToIso(value.occurredAt, timezone),
      description: nullable(value.description),
      notes: nullable(value.notes),
      merchantName: nullable(value.merchantName),
    }
    const selectedDebtId = (value.type === 'INCOME'
      ? value.accountId
      : value.destinationAccountId
    ).startsWith('debt:')
      ? (value.type === 'INCOME'
          ? value.accountId
          : value.destinationAccountId
        ).slice(5)
      : ''
    if (selectedDebtId) {
      onSubmit({
        type: 'DEBT_PAYMENT',
        debtId: selectedDebtId,
        ...((value.debtOperation ?? 'INSTALLMENT_PAYMENT') ===
          'INSTALLMENT_PAYMENT' && nextInstallment
          ? { installmentId: nextInstallment.id }
          : {}),
        operation: value.debtOperation ?? 'INSTALLMENT_PAYMENT',
        strategy: value.debtStrategy ?? 'REDUCE_TERM',
        ...(value.type === 'TRANSFER' ? { accountId: value.accountId } : {}),
        amount: common.amount,
        occurredAt: common.occurredAt,
        idempotencyKey: crypto.randomUUID(),
      })
      return
    }
    const cardPurchase = isCardPurchase
      ? {
          installmentCount: value.installmentCount,
          ...(value.periodicRate ? { periodicRate: value.periodicRate } : {}),
        }
      : undefined
    if (transaction)
      onSubmit({
        ...common,
        categoryId: value.categoryId,
        ...(value.type === 'TRANSFER'
          ? { destinationAccountId: value.destinationAccountId }
          : {}),
        cardPurchase: cardPurchase ?? null,
        version: transaction.version,
      })
    else if (value.type === 'TRANSFER')
      onSubmit({
        ...common,
        categoryId: value.categoryId,
        type: value.type,
        destinationAccountId: value.destinationAccountId,
      })
    else if (value.type === 'ADVANCE')
      onSubmit({
        ...common,
        type: value.type,
        destinationAccountId: value.destinationAccountId,
      })
    else
      onSubmit({
        ...common,
        ...(showCategory ? { categoryId: value.categoryId } : {}),
        type: value.type,
        ...(cardPurchase ? { cardPurchase } : {}),
      })
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
      {incomeExceedsCardDebt && (
        <p role="alert">El monto supera la deuda pendiente de la tarjeta.</p>
      )}
      <FormField
        label={
          type === 'TRANSFER'
            ? 'Cuenta origen'
            : type === 'ADVANCE'
              ? 'Tarjeta origen'
              : type === 'INCOME'
                ? 'Destino'
                : 'Cuenta'
        }
        htmlFor="transaction-account"
        required
        error={errors.accountId?.message}
      >
        {type === 'INCOME' ? (
          <Select id="transaction-account" {...register('accountId')}>
            <option value="">Selecciona un destino</option>
            <optgroup label="CUENTAS">
              {activeAccounts
                .filter((account) => account.nature === 'ASSET')
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} · Saldo actual:{' '}
                    {formatMoney(account.currentBalance, account.currency)}
                  </option>
                ))}
            </optgroup>
            <optgroup label="TARJETAS">
              {activeAccounts
                .filter((account) => account.type === 'CREDIT_CARD')
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} · Deuda pendiente:{' '}
                    {formatMoney(account.currentBalance, account.currency)}
                  </option>
                ))}
            </optgroup>
            <optgroup label="CRÉDITOS">
              {(debts.data?.items ?? [])
                .filter((debt) => Number(debt.currentBalance) > 0)
                .map((debt) => (
                  <option key={debt.id} value={`debt:${debt.id}`}>
                    {debt.name} · Deuda pendiente:{' '}
                    {formatMoney(debt.currentBalance, debt.currency)}
                  </option>
                ))}
            </optgroup>
          </Select>
        ) : (
          <TransactionAccountSelect
            id="transaction-account"
            context={type === 'ADVANCE' ? 'ADVANCE_SOURCE' : 'SOURCE'}
            accounts={activeAccounts.filter((account) =>
              type === 'ADVANCE'
                ? account.type === 'CREDIT_CARD'
                : type === 'TRANSFER'
                  ? account.nature === 'ASSET'
                  : true,
            )}
            {...register('accountId')}
          />
        )}
      </FormField>
      {(type === 'TRANSFER' || type === 'ADVANCE') && (
        <FormField
          label={type === 'TRANSFER' ? 'Destino' : 'Cuenta destino'}
          htmlFor="transaction-destination"
          required
          error={errors.destinationAccountId?.message}
        >
          {type === 'TRANSFER' ? (
            <Select
              id="transaction-destination"
              {...register('destinationAccountId')}
            >
              <option value="">Selecciona un destino</option>
              <optgroup label="CUENTAS Y TARJETAS">
                {activeAccounts
                  .filter(
                    (account) =>
                      account.id !== sourceId &&
                      (account.nature === 'ASSET' ||
                        account.type === 'CREDIT_CARD'),
                  )
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ·{' '}
                      {account.type === 'CREDIT_CARD'
                        ? `deuda ${formatMoney(account.currentBalance, account.currency)}`
                        : account.currency}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="CRÉDITOS">
                {(debts.data?.items ?? [])
                  .filter((debt) => Number(debt.currentBalance) > 0)
                  .map((debt) => (
                    <option key={debt.id} value={`debt:${debt.id}`}>
                      {debt.name} · deuda{' '}
                      {formatMoney(debt.currentBalance, debt.currency)}
                    </option>
                  ))}
              </optgroup>
            </Select>
          ) : (
            <TransactionAccountSelect
              id="transaction-destination"
              context="DESTINATION"
              required
              accounts={activeAccounts.filter(
                (account) =>
                  account.id !== sourceId &&
                  (type === 'ADVANCE'
                    ? account.nature === 'ASSET'
                    : account.nature === 'ASSET' ||
                      account.type === 'CREDIT_CARD'),
              )}
              {...register('destinationAccountId')}
            />
          )}
        </FormField>
      )}
      {isDebtContext && selectedDebt && (
        <fieldset className={styles.cardPurchaseFields}>
          <legend>
            {debtOperation === 'EXTRA_PAYMENT'
              ? 'Registrar abono extraordinario'
              : 'Registrar pago del crédito'}
          </legend>
          <p>
            <strong>{selectedDebt.name}</strong>
          </p>
          <p>
            Saldo actual:{' '}
            {formatMoney(selectedDebt.currentBalance, selectedDebt.currency)}
          </p>
          {nextInstallment && (
            <p>
              Próxima cuota:{' '}
              {formatMoney(nextInstallment.totalAmount, selectedDebt.currency)}{' '}
              · pagado{' '}
              {formatMoney(nextInstallment.paidAmount, selectedDebt.currency)} ·
              pendiente {formatMoney(installmentPending, selectedDebt.currency)}{' '}
              · vence{' '}
              {new Date(nextInstallment.dueDate).toLocaleDateString('es-CO')}
            </p>
          )}
          <FormField label="Aplicar como" htmlFor="debt-operation">
            <Select id="debt-operation" {...register('debtOperation')}>
              <option value="INSTALLMENT_PAYMENT" disabled={!nextInstallment}>
                Pagar próxima cuota
              </option>
              <option value="EXTRA_PAYMENT">Abono extraordinario</option>
            </Select>
          </FormField>
          {debtOperation === 'EXTRA_PAYMENT' && (
            <FormField label="Estrategia" htmlFor="debt-strategy">
              <Select id="debt-strategy" {...register('debtStrategy')}>
                <option value="REDUCE_TERM">Reducir plazo</option>
                <option value="REDUCE_PAYMENT">Reducir cuota</option>
              </Select>
            </FormField>
          )}
          <div className={styles.specializedSummary}>
            <strong>Origen del dinero</strong>
            <span>
              {type === 'INCOME'
                ? 'Externo'
                : sourceAccount
                  ? `${sourceAccount.name} · saldo ${formatMoney(sourceAccount.currentBalance, sourceAccount.currency)}`
                  : 'Selecciona una cuenta origen'}
            </span>
            <small>
              {type === 'INCOME'
                ? 'Este pago se aplicará directamente a la deuda y no aumentará el saldo de ninguna cuenta.'
                : 'El dinero saldrá de la cuenta seleccionada y se aplicará a la deuda.'}
            </small>
          </div>
          {sourceAccount &&
            sourceAccount.currency !== selectedDebt.currency && (
              <p role="alert">
                La cuenta y el crédito deben usar la misma moneda.
              </p>
            )}
          {debtInsufficientFunds && (
            <p role="alert">
              La cuenta seleccionada no tiene fondos suficientes.
            </p>
          )}
          {debtExceedsBalance && (
            <p role="alert">
              El abono supera el saldo pendiente del crédito. El máximo
              disponible es{' '}
              {formatMoney(selectedDebt.currentBalance, selectedDebt.currency)}.
            </p>
          )}
        </fieldset>
      )}
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
              minorUnits
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder="0,00"
            />
          )}
        />
        {formContext === 'DEBT_INSTALLMENT_PAYMENT' && installmentPending && (
          <small>
            Valor sugerido para cubrir la próxima cuota. Puedes modificarlo para
            registrar un pago parcial.
          </small>
        )}
      </FormField>
      {isPartialInstallment && (
        <p role="status">Este pago cubrirá parcialmente la cuota.</p>
      )}
      {debtExceedsInstallment && (
        <p role="alert">
          El máximo para pagar esta cuota es{' '}
          {formatMoney(installmentPending, selectedDebt?.currency ?? 'COP')}.
        </p>
      )}
      {type === 'TRANSFER' ? (
        <p role="status">
          {categories.isPending
            ? 'Preparando la transferencia…'
            : transferCategory
              ? destinationAccount?.nature === 'LIABILITY'
                ? `Deuda pendiente: $ ${Number(destinationAccount.currentBalance).toLocaleString('es-CO', { minimumFractionDigits: 2 })}. Este movimiento reducirá el saldo pendiente de la tarjeta.`
                : 'Transferencia entre cuentas.'
              : 'No se encontró una categoría de transferencia disponible.'}
        </p>
      ) : type === 'ADVANCE' ? (
        <p role="status">
          {sourceAccount?.creditLimit
            ? `Cupo disponible: $ ${availableCredit.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
            : 'Selecciona una tarjeta de crédito como origen.'}
          {advanceExceedsCredit ? ' El monto supera el cupo disponible.' : ''}
        </p>
      ) : !showCategory ? null : (
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <TransactionCategorySelector
              workspaceId={workspaceId}
              type={type}
              value={field.value}
              onChange={field.onChange}
              disabled={pending}
              error={errors.categoryId?.message}
            />
          )}
        />
      )}
      {isCardPurchase && (
        <fieldset className={styles.cardPurchaseFields}>
          <legend>Compra con tarjeta</legend>
          <p>
            Aparecerá automáticamente en la actividad y las compras de esta
            tarjeta.
          </p>
          <FormField label="Modalidad" htmlFor="transaction-installments">
            <Select
              id="transaction-installments"
              {...register('installmentCount', { valueAsNumber: true })}
            >
              <option value="1">Una cuota</option>
              {[2, 3, 6, 9, 12, 18, 24, 36].map((count) => (
                <option key={count} value={count}>
                  {count} cuotas
                </option>
              ))}
            </Select>
          </FormField>
          {installmentCount > 1 && (
            <FormField
              label="Tasa mensual si la conoces (opcional)"
              htmlFor="transaction-card-rate"
              error={errors.periodicRate?.message}
            >
              <Input
                id="transaction-card-rate"
                inputMode="decimal"
                placeholder="Ej. 1.89"
                {...register('periodicRate')}
              />
            </FormField>
          )}
        </fieldset>
      )}
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
      {presentation.counterparty && (
        <FormField
          label={presentation.counterparty.label}
          htmlFor="transaction-merchant"
          error={errors.merchantName?.message}
        >
          <Input
            id="transaction-merchant"
            placeholder={presentation.counterparty.placeholder}
            {...register('merchantName')}
          />
        </FormField>
      )}
      <FormField
        label="Descripción"
        htmlFor="transaction-description"
        error={errors.description?.message}
      >
        <Input
          id="transaction-description"
          placeholder={presentation.description}
          {...register('description')}
        />
      </FormField>
      <FormField
        label="Notas"
        htmlFor="transaction-notes"
        error={errors.notes?.message}
      >
        <Textarea
          id="transaction-notes"
          placeholder="Ej: Compra realizada con amigos"
          {...register('notes')}
        />
      </FormField>
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={pending}
          disabled={
            pending ||
            (type === 'TRANSFER' && !transferCategory) ||
            advanceExceedsCredit ||
            incomeExceedsCardDebt ||
            debtExceedsBalance ||
            debtExceedsInstallment ||
            debtCurrencyMismatch ||
            debtInsufficientFunds
          }
        >
          {transaction ? 'Guardar cambios' : 'Registrar movimiento'}
        </Button>
      </div>
    </form>
  )
}
