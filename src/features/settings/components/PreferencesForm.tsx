import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Button,
  CurrencyCombobox,
  FormField,
  Input,
  Select,
} from '@/components/ui'
import type { UserPreferences } from '@/features/workspace'
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
export function PreferencesForm({
  preferences,
  pending,
  error,
  onSubmit,
}: {
  preferences: UserPreferences
  pending: boolean
  error: unknown
  onSubmit: (input: PreferencesValues) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: { ...preferences, language: 'es-CO' },
  })
  return (
    <form
      className={styles.form}
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
    >
      {error != null && (
        <p className={styles.error} role="alert">
          {getSettingsErrorMessage(error)}
        </p>
      )}
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
      <p className={styles.help}>
        La moneda preferida controla valores predeterminados; no convierte ni
        modifica las cuentas existentes.
      </p>
      <Button type="submit" loading={pending} disabled={pending || !isDirty}>
        Guardar preferencias
      </Button>
    </form>
  )
}
