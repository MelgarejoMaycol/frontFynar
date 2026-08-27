import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { accountTypeLabels } from '../accounts.constants'
import {
  accountFormSchema,
  type AccountFormValues,
} from '../schemas/account.schemas'
import {
  accountTypes,
  type Account,
  type AccountInput,
  type UpdateAccountInput,
} from '../types/account.types'
import styles from './accounts.module.css'
import { accountErrorMessage } from '../accounts.errors'

const defaults = (currency: string, account?: Account): AccountFormValues => ({
  name: account?.name ?? '',
  type: account?.type ?? 'CASH',
  nature: account?.nature ?? 'ASSET',
  institutionName: account?.institutionName ?? '',
  currency: account?.currency ?? currency,
  openingBalance: account?.openingBalance ?? '0.00',
  creditLimit: account?.creditLimit ?? '',
  billingDay: account?.billingDay?.toString() ?? '',
  paymentDueDay: account?.paymentDueDay?.toString() ?? '',
  includeInNetWorth: account?.includeInNetWorth ?? true,
  isFavorite: account?.isFavorite ?? false,
})
const payload = (
  values: AccountFormValues,
  editing = false,
): AccountInput | UpdateAccountInput => ({
  name: values.name,
  type: values.type,
  nature: values.nature,
  ...(values.institutionName
    ? { institutionName: values.institutionName }
    : { institutionName: null }),
  currency: values.currency,
  ...(!editing ? { openingBalance: values.openingBalance } : {}),
  ...(values.type === 'CREDIT_CARD'
    ? {
        creditLimit: values.creditLimit || null,
        billingDay: values.billingDay ? Number(values.billingDay) : null,
        paymentDueDay: values.paymentDueDay
          ? Number(values.paymentDueDay)
          : null,
      }
    : { creditLimit: null, billingDay: null, paymentDueDay: null }),
  includeInNetWorth: values.includeInNetWorth,
  isFavorite: values.isFavorite,
})
const natureForType = (type: AccountFormValues['type']) =>
  type === 'CREDIT_CARD' || type === 'LOAN' ? 'LIABILITY' : 'ASSET'
const accountCreationTypes = accountTypes.filter((type) => type !== 'CREDIT_CARD')
export function AccountForm({
  currency,
  account,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  currency: string
  account?: Account
  pending: boolean
  error: unknown
  onSubmit: (input: AccountInput | UpdateAccountInput) => void
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: defaults(currency, account),
  })
  const type = useWatch({ control, name: 'type' })
  useEffect(() => {
    setValue('nature', natureForType(type), { shouldValidate: true })
    if (type !== 'CREDIT_CARD') {
      setValue('creditLimit', '')
      setValue('billingDay', '')
      setValue('paymentDueDay', '')
    }
  }, [setValue, type])
  return (
    <form
      className={styles.form}
      onSubmit={(event) =>
        void handleSubmit((values) =>
          onSubmit(payload(values, Boolean(account))),
        )(event)
      }
      noValidate
    >
      {error != null && (
        <p className={styles.error} role="alert">
          {accountErrorMessage(error)}
        </p>
      )}
      <fieldset className={styles.formSection}>
        <legend>Datos principales</legend>
        <div className={styles.formGrid}>
          <FormField
            label="Nombre"
            htmlFor="account-name"
            required
            error={errors.name?.message}
          >
            <Input
              id="account-name"
              placeholder={
                type === 'CASH'
                  ? 'Ej: Efectivo personal'
                  : type === 'E_WALLET'
                    ? 'Ej: Nequi'
                    : 'Ej: Cuenta de ahorros'
              }
              {...register('name')}
            />
          </FormField>
          <FormField
            label="Tipo"
            htmlFor="account-type"
            required
            error={errors.type?.message}
          >
            <Select id="account-type" {...register('type')}>
              {accountCreationTypes.map((value) => (
                <option key={value} value={value}>
                  {accountTypeLabels[value]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </fieldset>
      <fieldset className={styles.formSection}>
        <legend>Información financiera</legend>
        <div className={styles.formGrid}>
          <FormField
            label="Institución"
            htmlFor="account-institution"
            error={errors.institutionName?.message}
          >
            <Input
              id="account-institution"
              placeholder={type === 'E_WALLET' ? 'Ej: Nequi' : 'Ej: Bancolombia'}
              {...register('institutionName')}
            />
          </FormField>
          {!account && (
            <FormField
              label="Moneda"
              htmlFor="account-currency"
              required
              error={errors.currency?.message}
            >
              <CurrencyCombobox
                id="account-currency"
                maxLength={3}
                {...register('currency')}
              />
            </FormField>
          )}
          {!account && <FormField
            label="Saldo inicial"
            htmlFor="account-opening"
            required
            error={errors.openingBalance?.message}
          >
            <Controller
              control={control}
              name="openingBalance"
              render={({ field }) => (
                <MoneyInput
                  id="account-opening"
                  minorUnits
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              )}
            />
          </FormField>}
          {type === 'CREDIT_CARD' && (
            <>
              <FormField
                label="Cupo"
                htmlFor="account-limit"
                error={errors.creditLimit?.message}
              >
                <Controller
                  control={control}
                  name="creditLimit"
                  render={({ field }) => (
                    <MoneyInput
                      id="account-limit"
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
              </FormField>
              <FormField
                label="Día de corte"
                htmlFor="account-billing"
                error={errors.billingDay?.message}
              >
                <Input
                  id="account-billing"
                  inputMode="numeric"
                  {...register('billingDay')}
                />
              </FormField>
              <FormField
                label="Día límite de pago"
                htmlFor="account-due"
                error={errors.paymentDueDay?.message}
              >
                <Input
                  id="account-due"
                  inputMode="numeric"
                  {...register('paymentDueDay')}
                />
              </FormField>
            </>
          )}
        </div>
      </fieldset>
      <fieldset className={styles.formSection}>
        <legend>Opciones</legend>
        <div className={styles.checks}>
          <Checkbox
            label="Incluir en patrimonio"
            {...register('includeInNetWorth')}
          />
          <Checkbox label="Marcar como favorita" {...register('isFavorite')} />
        </div>
      </fieldset>
      <div className={styles.formActions}>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={pending}>
          {account ? 'Guardar cambios' : 'Crear cuenta'}
        </Button>
      </div>
    </form>
  )
}
