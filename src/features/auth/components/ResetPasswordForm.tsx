import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { Button, FormField, PasswordInput } from '@/components/ui'
import { authApi } from '../api/auth.api'
import { getAuthErrorMessage } from '../auth.errors'
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from '../schemas/auth.schemas'
import styles from './auth.module.css'

export function ResetPasswordForm() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [done, setDone] = useState(false)
  const mutation = useMutation({
    mutationFn: ({ password }: ResetPasswordValues) =>
      authApi.resetPassword({ token: token ?? '', newPassword: password }),
    onSuccess: () => setDone(true),
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })
  const submit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values)
    } catch {
      // La mutación conserva el error seguro que renderiza el formulario.
    }
  })
  if (!token)
    return (
      <p className={styles.generalError} role="alert">
        El enlace de recuperación no contiene un token válido.
      </p>
    )
  if (done)
    return (
      <div className={styles.success} role="status">
        Tu contraseña fue actualizada. <Link to="/login">Inicia sesión</Link>.
      </div>
    )
  return (
    <form
      className={styles.form}
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      {mutation.error && (
        <p className={styles.generalError} role="alert">
          {getAuthErrorMessage(mutation.error, 'reset')}
        </p>
      )}
      <FormField
        label="Nueva contraseña"
        htmlFor="reset-password"
        required
        helpText="Usa entre 10 y 128 caracteres."
        error={errors.password?.message}
      >
        <PasswordInput
          id="reset-password"
          autoComplete="new-password"
          {...register('password')}
        />
      </FormField>
      <FormField
        label="Confirmar contraseña"
        htmlFor="reset-confirm-password"
        required
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="reset-confirm-password"
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
      </FormField>
      <Button
        className={styles.submit}
        type="submit"
        loading={mutation.isPending}
      >
        Actualizar contraseña
      </Button>
    </form>
  )
}
