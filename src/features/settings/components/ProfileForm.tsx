import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, FormField, Input } from '@/components/ui'
import type { AuthUser } from '@/features/auth/types/auth.types'
import { getSettingsErrorMessage } from '../settings.errors'
import { profileSchema, type ProfileValues } from '../schemas/settings.schemas'
import type { UpdateProfileInput } from '../api/settings.api'
import styles from '@/features/auth/pages/settings.module.css'

export function ProfileForm({
  user,
  pending,
  error,
  onSubmit,
}: {
  user: AuthUser
  pending: boolean
  error: unknown
  onSubmit: (input: UpdateProfileInput) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName ?? '',
      phone: user.phone ?? '',
    },
  })
  return (
    <form
      className={styles.form}
      onSubmit={(event) =>
        void handleSubmit((value) =>
          onSubmit({
            firstName: value.firstName,
            lastName: value.lastName || null,
            phone: value.phone || null,
          }),
        )(event)
      }
    >
      {error != null && (
        <p className={styles.error} role="alert">
          {getSettingsErrorMessage(error)}
        </p>
      )}
      <div className={styles.formGrid}>
        <FormField
          label="Nombre"
          htmlFor="profile-first-name"
          required
          error={errors.firstName?.message}
        >
          <Input id="profile-first-name" {...register('firstName')} />
        </FormField>
        <FormField
          label="Apellido"
          htmlFor="profile-last-name"
          error={errors.lastName?.message}
        >
          <Input id="profile-last-name" {...register('lastName')} />
        </FormField>
        <FormField
          label="Teléfono"
          htmlFor="profile-phone"
          error={errors.phone?.message}
        >
          <Input id="profile-phone" type="tel" {...register('phone')} />
        </FormField>
        <FormField label="Correo electrónico" htmlFor="profile-email">
          <Input id="profile-email" value={user.email} readOnly />
        </FormField>
      </div>
      <p className={styles.help}>
        El correo electrónico no puede modificarse desde esta pantalla.
      </p>
      <Button type="submit" loading={pending} disabled={pending || !isDirty}>
        Guardar perfil
      </Button>
    </form>
  )
}
