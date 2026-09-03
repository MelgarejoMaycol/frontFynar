import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  Button,
  CurrencyCombobox,
  FormField,
  Input,
  MoneyInput,
  Select,
} from '@/components/ui'
import type {
  UpdateUserPreferences,
  UserPreferences,
} from '@/features/workspace'
import { getSettingsErrorMessage } from '../settings.errors'
import {
  preferencesSchema,
  type PreferencesValues,
} from '../schemas/settings.schemas'
import styles from '@/features/auth/pages/settings.module.css'

const timezones = [
  'America/Bogota',
  'America/Argentina/Buenos_Aires',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Lima',
  'America/Mexico_City',
  'America/New_York',
  'America/Santiago',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Dubai',
  'Australia/Sydney',
  'UTC',
]

const projectionDefaults = (preferences: UserPreferences) => {
  const projection = preferences.dashboardLayout.projection
  return {
    projectionMode:
      projection?.mode === 'CYCLE_END' ? ('CYCLE_END' as const) : ('MONTH_END' as const),
    salaryEnabled: projection?.enabled === true,
    expectedMonthlyIncome:
      typeof projection?.expectedMonthlyIncome === 'string'
        ? projection.expectedMonthlyIncome
        : null,
    salaryPayDay:
      typeof projection?.payDay === 'number' ? projection.payDay : null,
  }
}

export function PreferencesForm({
  preferences,
  pending,
  error,
  onSubmit,
}: {
  preferences: UserPreferences
  pending: boolean
  error: unknown
  onSubmit: (input: UpdateUserPreferences) => void
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: preferences.theme,
      currency: preferences.currency,
      timezone: preferences.timezone,
      language: preferences.language === 'en-US' ? 'en-US' : 'es-CO',
      dateFormat: preferences.dateFormat,
      startScreen: preferences.startScreen,
      financialCycleStartDay: preferences.financialCycleStartDay ?? null,
      ...projectionDefaults(preferences),
    },
  })
  const salaryEnabled = useWatch({ control, name: 'salaryEnabled' })
  const projectionMode = useWatch({ control, name: 'projectionMode' })

  const submit = (values: PreferencesValues) => {
    const {
      projectionMode: mode,
      salaryEnabled: enabled,
      expectedMonthlyIncome,
      salaryPayDay,
      ...standardPreferences
    } = values
    onSubmit({
      ...standardPreferences,
      dashboardLayout: {
        ...preferences.dashboardLayout,
        projection: {
          mode,
          enabled,
          expectedMonthlyIncome: enabled ? expectedMonthlyIncome : null,
          payDay: enabled ? salaryPayDay : null,
        },
      },
    })
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => void handleSubmit(submit)(event)}
    >
      {error != null && (
        <p className={styles.error} role="alert">
          {getSettingsErrorMessage(error)}
        </p>
      )}

      <div className={styles.preferenceGroup}>
        <div className={styles.preferenceGroupHeader}>
          <div>
            <h3>Proyección financiera</h3>
            <p className={styles.help}>
              Define hasta dónde quieres proyectar y un ingreso mensual esperado para que Fynar pueda anticipar mejor tu liquidez.
            </p>
          </div>
        </div>
        <div className={styles.formGrid}>
          <FormField
            label="Proyectar hasta"
            htmlFor="preferences-projection-mode"
            error={errors.projectionMode?.message}
          >
            <Select id="preferences-projection-mode" {...register('projectionMode')}>
              <option value="MONTH_END">Fin de mes</option>
              <option value="CYCLE_END">Fin de mi ciclo financiero</option>
            </Select>
            {projectionMode === 'CYCLE_END' && (
              <small className={styles.help}>
                La fecha de cierre se calcula con el día de inicio del ciclo configurado abajo.
              </small>
            )}
          </FormField>

          <FormField
            label="Inicio del ciclo financiero"
            htmlFor="preferences-cycle-start"
            error={errors.financialCycleStartDay?.message}
          >
            <Input
              id="preferences-cycle-start"
              type="number"
              min={1}
              max={28}
              {...register('financialCycleStartDay', {
                setValueAs: (value) => (value === '' ? null : Number(value)),
              })}
            />
            <small className={styles.help}>
              Día 1 a 28. Solo se usa para la proyección cuando eliges fin de ciclo.
            </small>
          </FormField>

          <div className={styles.preferenceToggle}>
            <input
              id="preferences-salary-enabled"
              type="checkbox"
              {...register('salaryEnabled')}
            />
            <label htmlFor="preferences-salary-enabled">
              <strong>Incluir mi sueldo o ingreso fijo esperado</strong>
              <span>
                No crea movimientos ni aumenta tu saldo real; solo se usa mientras esa fecha todavía esté por llegar.
              </span>
            </label>
          </div>

          <div className={styles.preferenceSpacer} aria-hidden="true" />

          <FormField
            label="Sueldo o ingreso mensual esperado"
            htmlFor="preferences-expected-income"
            error={errors.expectedMonthlyIncome?.message}
          >
            <Controller
              control={control}
              name="expectedMonthlyIncome"
              render={({ field }) => (
                <MoneyInput
                  id="preferences-expected-income"
                  value={field.value ?? ''}
                  currency={preferences.currency}
                  minorUnits
                  disabled={!salaryEnabled}
                  onBlur={field.onBlur}
                  onValueChange={(value) => field.onChange(value === '' ? null : value)}
                />
              )}
            />
          </FormField>

          <FormField
            label="Día en que normalmente me pagan"
            htmlFor="preferences-salary-pay-day"
            error={errors.salaryPayDay?.message}
          >
            <Input
              id="preferences-salary-pay-day"
              type="number"
              min={1}
              max={28}
              disabled={!salaryEnabled}
              {...register('salaryPayDay', {
                setValueAs: (value) => (value === '' ? null : Number(value)),
              })}
            />
            <small className={styles.help}>
              Usamos hasta el día 28 para que la fecha exista en todos los meses.
            </small>
          </FormField>
        </div>
      </div>

      <div className={styles.preferenceGroup}>
        <div className={styles.preferenceGroupHeader}>
          <div>
            <h3>Apariencia y valores predeterminados</h3>
          </div>
        </div>
        <div className={styles.formGrid}>
          <FormField
            label="Tema"
            htmlFor="preferences-theme"
            error={errors.theme?.message}
          >
            <Select id="preferences-theme" {...register('theme')}>
              <option value="SYSTEM">Sistema</option>
              <option value="LIGHT">Claro</option>
              <option value="DARK">Oscuro</option>
            </Select>
          </FormField>
          <FormField
            label="Moneda preferida"
            htmlFor="preferences-currency"
            error={errors.currency?.message}
          >
            <CurrencyCombobox
              id="preferences-currency"
              maxLength={3}
              {...register('currency')}
            />
          </FormField>
          <FormField
            label="Zona horaria"
            htmlFor="preferences-timezone"
            error={errors.timezone?.message}
          >
            <Input
              id="preferences-timezone"
              list="iana-timezones"
              autoComplete="off"
              {...register('timezone')}
            />
          </FormField>
          <datalist id="iana-timezones">
            {timezones.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone === 'America/Bogota'
                  ? 'Bogotá, Popayán, Cali, Medellín'
                  : timezone}
              </option>
            ))}
          </datalist>
          <FormField
            label="Idioma"
            htmlFor="preferences-language"
            error={errors.language?.message}
          >
            <Select id="preferences-language" {...register('language')}>
              <option value="es-CO">Español</option>
              <option value="en-US">English</option>
            </Select>
          </FormField>
          <FormField
            label="Formato de fecha"
            htmlFor="preferences-date-format"
            error={errors.dateFormat?.message}
          >
            <Select id="preferences-date-format" {...register('dateFormat')}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </Select>
          </FormField>
          <FormField
            label="Pantalla inicial"
            htmlFor="preferences-start-screen"
            error={errors.startScreen?.message}
          >
            <Select id="preferences-start-screen" {...register('startScreen')}>
              <option value="DASHBOARD">Inicio</option>
              <option value="TRANSACTIONS">Movimientos</option>
              <option value="BUDGETS">Presupuestos</option>
            </Select>
          </FormField>
        </div>
      </div>

      <p className={styles.help}>
        Al guardar cambios financieros, Fynar invalida la proyección anterior y la calcula nuevamente con la nueva configuración.
      </p>
      <Button type="submit" loading={pending} disabled={pending || !isDirty}>
        Guardar preferencias
      </Button>
    </form>
  )
}
