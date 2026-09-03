import { zodResolver } from '@hookform/resolvers/zod'
import { createElement, type CSSProperties } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  Button,
  FormField,
  Input,
  MoneyInput,
  Select,
} from '@/components/ui'
import { canonicalMoneyInput } from '@/components/ui/money-input.utils'
import { useAccounts } from '@/features/accounts/hooks/accounts.hooks'
import { formatMoney } from '@/features/transactions/transactions.format'
import { getGoalErrorMessage } from '../goals.errors'
import {
  goalColorLabels,
  goalColors,
  goalIconLabels,
  goalIconOptions,
  goalIcons,
} from '../goals.visual'
import {
  goalFormSchema,
  type GoalFormValues,
} from '../schemas/goal.schemas'
import type { Goal, GoalInput } from '../types/goal.types'
import styles from './goals.module.css'

export function GoalForm({
  workspaceId,
  goal,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  workspaceId: string
  goal?: Goal
  pending: boolean
  error: unknown
  onSubmit: (input: GoalInput) => void
  onCancel: () => void
}) {
  const accounts = useAccounts(workspaceId, true, false, 'all', true)
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: goal?.name ?? '',
      targetAmount: goal?.targetAmount ?? '',
      targetDate: goal?.targetDate ?? '',
      accountId: goal?.account?.id ?? '',
      icon: goal?.icon ?? 'target',
      color: goal?.color ?? '#2F855A',
    },
  })

  const name = useWatch({ control, name: 'name' })
  const icon = useWatch({ control, name: 'icon' })
  const color = useWatch({ control, name: 'color' })
  const PreviewIcon = goalIcons[icon || 'target'] ?? goalIcons.target

  const availableAccounts = (accounts.data ?? []).filter(
    (account) => account.isActive && account.nature === 'ASSET',
  )

  return (
    <form
      className={styles.form}
      onSubmit={(event) =>
        void handleSubmit((values) =>
          onSubmit({
            name: values.name.trim(),
            targetAmount: canonicalMoneyInput(values.targetAmount),
            targetDate: values.targetDate || null,
            accountId: values.accountId || null,
            icon: values.icon || null,
            color: values.color || null,
          }),
        )(event)
      }
    >
      <div className={styles.formIntro}>
        <strong>{goal ? 'Ajusta tu objetivo' : 'Convierte una intención en un plan'}</strong>
        <p>
          La meta organiza dinero que ya existe en tus cuentas. Crear o aportar a
          una meta no descuenta ni duplica tu saldo bancario.
        </p>
      </div>

      {error != null && <p role="alert">{getGoalErrorMessage(error)}</p>}

      <section
        className={styles.identityPreview}
        aria-label="Vista previa de la identidad de la meta"
        style={{ '--goal-color': color || '#2F855A' } as CSSProperties}
      >
        <span>Vista previa</span>
        <div className={styles.identityPreviewContent}>
          <span className={styles.identityPreviewIcon} aria-hidden="true">
            <PreviewIcon size={24} strokeWidth={2} />
          </span>
          <div>
            <strong>{name.trim() || 'Tu nueva meta'}</strong>
            <small>{goalIconLabels[icon || 'target'] ?? 'Objetivo'}</small>
          </div>
        </div>
      </section>

      <FormField
        label="Nombre de la meta"
        htmlFor="goal-name"
        required
        error={errors.name?.message}
      >
        <Input
          id="goal-name"
          placeholder="Ej: Comprar mi moto"
          autoComplete="off"
          {...register('name')}
        />
      </FormField>

      <FormField
        label="Valor objetivo"
        htmlFor="goal-target"
        required
        error={errors.targetAmount?.message}
        helpText="El valor total que quieres reunir."
      >
        <Controller
          control={control}
          name="targetAmount"
          render={({ field }) => (
            <MoneyInput
              id="goal-target"
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

      <div className={styles.formGrid}>
        <FormField
          label="Fecha objetivo"
          htmlFor="goal-target-date"
          error={errors.targetDate?.message}
          helpText="Opcional. Sirve para calcular cuánto deberías ahorrar al mes."
        >
          <Input id="goal-target-date" type="date" {...register('targetDate')} />
        </FormField>

        <FormField
          label="Cuenta asociada"
          htmlFor="goal-account"
          error={errors.accountId?.message}
          helpText="Opcional. Debe ser una cuenta activa de dinero."
        >
          <Select id="goal-account" {...register('accountId')}>
            <option value="">Sin cuenta específica</option>
            {availableAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {formatMoney(account.currentBalance, account.currency)}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <fieldset className={styles.identityField}>
        <legend>Icono</legend>
        <p>Elige el símbolo que mejor represente esta meta.</p>
        <div className={styles.identityIconGrid} id="goal-icon">
          {goalIconOptions.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={icon === value}
              title={goalIconLabels[value]}
              className={
                icon === value ? styles.identityIconSelected : styles.identityIconOption
              }
              onClick={() => setValue('icon', value, { shouldDirty: true })}
            >
              {createElement(goalIcons[value], { 'aria-hidden': true })}
              <span>{goalIconLabels[value]}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.identityField}>
        <legend>Color</legend>
        <p>Usa un color para reconocer la meta rápidamente en toda Fynar.</p>
        <div
          className={styles.identityColorGrid}
          id="goal-color"
          role="radiogroup"
          aria-label="Color de la meta"
        >
          {goalColors.map((value, index) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={color === value}
              aria-label={goalColorLabels[index]}
              title={goalColorLabels[index]}
              className={
                color === value
                  ? styles.identityColorSelected
                  : styles.identityColorOption
              }
              style={{ backgroundColor: value }}
              onClick={() => setValue('color', value, { shouldDirty: true })}
            />
          ))}
        </div>
      </fieldset>

      {availableAccounts.length === 0 && !accounts.isPending && (
        <div className={styles.notice}>
          <strong>No tienes una cuenta de dinero disponible.</strong>
          <span>
            Puedes crear la meta sin asociarla y vincular una cuenta después.
          </span>
        </div>
      )}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={pending} disabled={pending}>
          {goal ? 'Guardar cambios' : 'Crear meta'}
        </Button>
      </div>
    </form>
  )
}
