import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, FormField, PasswordInput } from '@/components/ui'
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from '../schemas/settings.schemas'
import { getSettingsErrorMessage } from '../settings.errors'
import { ApiError } from '@/services/http'
import styles from '@/features/auth/pages/settings.module.css'

export function ChangePasswordForm({
  pending,
  error,
  onSubmit,
}: {
  pending: boolean
  error: unknown
  onSubmit: (value: ChangePasswordValues, reset: () => void) => void
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })
  return (
    <form
      className={styles.form}
      onSubmit={(event) =>
        void handleSubmit((value) => onSubmit(value, reset))(event)
      }
    >
      {error != null && (
        <p className={styles.error} role="alert">
          {error instanceof ApiError && error.status === 401
            ? 'La contraseña actual no es correcta.'
            : getSettingsErrorMessage(error)}
        </p>
      )}
      <div className={styles.formGrid}>
        <FormField
          label="Contraseña actual"
          htmlFor="current-password"
          required
          error={errors.currentPassword?.message}
        >
          <PasswordInput
            id="current-password"
            autoComplete="current-password"
            {...register('currentPassword')}
          />
        </FormField>
        <FormField
          label="Nueva contraseña"
          htmlFor="new-password"
          required
          error={errors.newPassword?.message}
        >
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            {...register('newPassword')}
          />
        </FormField>
        <FormField
          label="Confirmar nueva contraseña"
          htmlFor="confirm-password"
          required
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
        </FormField>
      </div>
      <Button type="submit" loading={pending} disabled={pending || !isDirty}>
        Cambiar contraseña
      </Button>
    </form>
  )
}
