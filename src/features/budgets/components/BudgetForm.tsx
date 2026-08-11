import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  Button,
  Checkbox,
  CurrencyCombobox,
  FormField,
  Input,
  MoneyInput,
  Select,
} from '@/components/ui'
import { useAccounts } from '@/features/accounts/hooks/accounts.hooks'
import { useCategories } from '@/features/categories/hooks/categories.hooks'
import { isoToWorkspaceDateTimeValue } from '@/features/transactions/transactions.format'
import { currencyLabel } from '@/components/ui/currencies'
import { rangeForPeriod } from '../budgets.constants'
import {
  budgetFormSchema,
  type BudgetFormValues,
} from '../schemas/budget.schemas'
import { getBudgetErrorMessage } from '../budgets.errors'
import type { Budget, BudgetInput } from '../types/budget.types'
import styles from './budgets.module.css'
const currentMonth = (timezone: string) => {
  const localDate = isoToWorkspaceDateTimeValue(
      new Date().toISOString(),
      timezone,
    ).slice(0, 10),
    [y, month] = localDate.split('-').map(Number),
    m = month - 1
  return {
    start: `${y}-${String(m + 1).padStart(2, '0')}-01`,
    end: new Date(Date.UTC(y, m + 1, 0)).toISOString().slice(0, 10),
  }
}
export function BudgetForm({
  workspaceId,
  baseCurrency,
  timezone,
  budget,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  workspaceId: string
  baseCurrency: string
  timezone: string
  budget?: Budget
  pending: boolean
  error: unknown
  onSubmit: (input: BudgetInput) => void
  onCancel: () => void
}) {
  const month = currentMonth(timezone)
  const accounts = useAccounts(workspaceId),
    categories = useCategories(workspaceId)
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: budget?.name ?? '',
      period: budget?.period ?? 'MONTHLY',
      startsOn: budget?.startsOn ?? month.start,
      endsOn: budget?.endsOn ?? month.end,
      amount: budget?.amount ?? '',
      currency: budget?.currency ?? baseCurrency,
      alertThreshold: String(Number(budget?.alertThreshold ?? '80')),
      rolloverEnabled: budget?.rolloverEnabled ?? false,
      categoryIds: budget?.categories.map((x) => x.id) ?? [],
      accountIds: budget?.accounts.map((x) => x.id) ?? [],
    },
  })
  const period = useWatch({ control, name: 'period' }),
    currency = useWatch({ control, name: 'currency' }),
    startsOn = useWatch({ control, name: 'startsOn' }),
    endsOn = useWatch({ control, name: 'endsOn' }),
    categoryIds = useWatch({ control, name: 'categoryIds' }),
    accountIds = useWatch({ control, name: 'accountIds' })
  useEffect(() => {
    if (period === 'CUSTOM') return
    const range = rangeForPeriod(period, getValues('startsOn'))
    setValue('startsOn', range.start, { shouldValidate: true })
    setValue('endsOn', range.end, { shouldValidate: true })
  }, [getValues, period, setValue])
  useEffect(() => {
    const compatible = new Set(
        (accounts.data ?? [])
          .filter(
            (account) =>
              account.isActive && account.currency === currency.toUpperCase(),
          )
          .map((account) => account.id),
      ),
      next = accountIds.filter((id) => compatible.has(id))
    if (next.length !== accountIds.length)
      setValue('accountIds', next, { shouldDirty: true })
  }, [accountIds, accounts.data, currency, setValue])
  const toggle = (
    field: 'categoryIds' | 'accountIds',
    values: string[],
    id: string,
  ) =>
    setValue(
      field,
      values.includes(id) ? values.filter((x) => x !== id) : [...values, id],
    )
  return (
    <form
      className={styles.form}
      onSubmit={(e) =>
        void handleSubmit((v) =>
          onSubmit({ ...v, currency: v.currency.toUpperCase() }),
        )(e)
      }
    >
      {error != null && <p role="alert">{getBudgetErrorMessage(error)}</p>}
      <FormField
        label="Nombre"
        htmlFor="budget-name"
        required
        error={errors.name?.message}
      >
        <Input id="budget-name" {...register('name')} />
      </FormField>
      <FormField
        label="Periodo"
        htmlFor="budget-period"
        required
        error={errors.period?.message}
      >
        <Select id="budget-period" {...register('period')}>
          <option value="MONTHLY">Mensual</option>
          <option value="WEEKLY">Semanal</option>
          <option value="YEARLY">Anual</option>
          <option value="CUSTOM">Personalizado</option>
        </Select>
      </FormField>
      <div className={styles.periodFields}>
        {period === 'MONTHLY' && (
          <FormField label="Mes" htmlFor="budget-month">
            <Input
              id="budget-month"
              type="month"
              value={startsOn.slice(0, 7)}
              onChange={(event) => {
                const range = rangeForPeriod(
                  'MONTHLY',
                  `${event.target.value}-01`,
                )
                setValue('startsOn', range.start)
                setValue('endsOn', range.end)
              }}
            />
          </FormField>
        )}
        {period === 'WEEKLY' && (
          <FormField label="La semana comienza" htmlFor="budget-week">
            <Input
              id="budget-week"
              type="date"
              {...register('startsOn')}
              onChange={(event) => {
                const range = rangeForPeriod('WEEKLY', event.target.value)
                setValue('startsOn', range.start)
                setValue('endsOn', range.end)
              }}
            />
          </FormField>
        )}
        {period === 'YEARLY' && (
          <FormField label="Año" htmlFor="budget-year">
            <Input
              id="budget-year"
              type="number"
              min="2000"
              max="2100"
              value={startsOn.slice(0, 4)}
              onChange={(event) => {
                const range = rangeForPeriod(
                  'YEARLY',
                  `${event.target.value}-01-01`,
                )
                setValue('startsOn', range.start)
                setValue('endsOn', range.end)
              }}
            />
          </FormField>
        )}
        {period !== 'CUSTOM' && (
          <p className={styles.rangePreview}>
            {startsOn} — {endsOn}
          </p>
        )}
      </div>
      {period === 'CUSTOM' && (
        <div className={styles.formGrid}>
          <FormField
            label="Desde"
            htmlFor="budget-start"
            required
            error={errors.startsOn?.message}
          >
            <Input id="budget-start" type="date" {...register('startsOn')} />
          </FormField>
          <FormField
            label="Hasta"
            htmlFor="budget-end"
            required
            error={errors.endsOn?.message}
          >
            <Input id="budget-end" type="date" {...register('endsOn')} />
          </FormField>
        </div>
      )}
      <div className={styles.formGrid}>
        <FormField
          label="Monto"
          htmlFor="budget-amount"
          required
          error={errors.amount?.message}
        >
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <MoneyInput
                id="budget-amount"
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
        </FormField>
        <FormField
          label="Moneda"
          htmlFor="budget-currency"
          required
          error={errors.currency?.message}
        >
          <CurrencyCombobox id="budget-currency" {...register('currency')} />
        </FormField>
        <FormField
          label="Avisarme al llegar al"
          htmlFor="budget-threshold"
          required
          error={errors.alertThreshold?.message}
          helpText="Te avisaremos cuando hayas utilizado este porcentaje del presupuesto."
        >
          <Input
            id="budget-threshold"
            type="number"
            min="1"
            max="100"
            step="1"
            {...register('alertThreshold')}
          />
        </FormField>
      </div>
      <fieldset>
        <legend>Categorías de gasto</legend>
        <div className={styles.options}>
          {(categories.data ?? [])
            .filter((x) => x.type === 'EXPENSE' && x.isActive)
            .map((x) => (
              <Checkbox
                key={x.id}
                label={x.name}
                checked={categoryIds.includes(x.id)}
                onChange={() => toggle('categoryIds', categoryIds, x.id)}
              />
            ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Cuentas opcionales ({currency.toUpperCase()})</legend>
        <div className={styles.options}>
          {(accounts.data ?? [])
            .filter((x) => x.isActive && x.currency === currency.toUpperCase())
            .map((x) => (
              <Checkbox
                key={x.id}
                label={`${x.name} · ${x.currency}`}
                checked={accountIds.includes(x.id)}
                onChange={() => toggle('accountIds', accountIds, x.id)}
              />
            ))}
          {!(accounts.data ?? []).some(
            (x) => x.isActive && x.currency === currency.toUpperCase(),
          ) && (
            <div className={styles.noAccounts}>
              <strong>No tienes cuentas en {currency.toUpperCase()}</strong>
              <p>
                Crea una cuenta en {currencyLabel(currency.toUpperCase())} o
                selecciona otra moneda.
              </p>
              <a href="/app/accounts?new=1">Crear cuenta</a>
            </div>
          )}
        </div>
      </fieldset>
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={pending} disabled={pending}>
          {budget ? 'Guardar cambios' : 'Crear presupuesto'}
        </Button>
      </div>
    </form>
  )
}
