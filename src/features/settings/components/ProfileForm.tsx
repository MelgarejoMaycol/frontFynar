import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Button, FormField, Input } from '@/components/ui'
import type { AuthUser } from '@/features/auth/types/auth.types'
import { getSettingsErrorMessage } from '../settings.errors'
import { profileSchema, type ProfileValues } from '../schemas/settings.schemas'
import type { UpdateProfileInput } from '../api/settings.api'
import styles from '@/features/auth/pages/settings.module.css'
import { settingsApi } from '../api/settings.api'

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
  const [changingEmail, setChangingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [emailStatus, setEmailStatus] = useState<
    'idle' | 'pending' | 'sent' | 'error'
  >('idle')
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
        ✓ Verificado. Tu correo actual seguirá activo durante cualquier cambio
        pendiente.
      </p>
      {!changingEmail ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setChangingEmail(true)}
        >
          Cambiar correo
        </Button>
      ) : (
        <div className={styles.formGrid}>
          <FormField label="Nuevo correo" htmlFor="new-email">
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
            />
          </FormField>
          <FormField label="Contraseña actual" htmlFor="email-password">
            <Input
              id="email-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </FormField>
          {emailStatus === 'sent' && (
            <p className={styles.help} role="status">
              Te enviamos un enlace al nuevo correo. El actual seguirá
              funcionando hasta confirmarlo.
            </p>
          )}
          {emailStatus === 'error' && (
            <p className={styles.error} role="alert">
              No pudimos enviar el correo. Inténtalo nuevamente.
            </p>
          )}
          <Button
            type="button"
            loading={emailStatus === 'pending'}
            disabled={!newEmail || !currentPassword}
            onClick={() => {
              setEmailStatus('pending')
              void settingsApi
                .requestEmailChange({ newEmail, currentPassword })
                .then(() => setEmailStatus('sent'))
                .catch(() => setEmailStatus('error'))
            }}
          >
            Enviar verificación
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setChangingEmail(false)}
          >
            Cancelar
          </Button>
        </div>
      )}
      <Button type="submit" loading={pending} disabled={pending || !isDirty}>
        Guardar perfil
      </Button>
    </form>
  )
}
