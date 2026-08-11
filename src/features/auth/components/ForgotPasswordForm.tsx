import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Button, FormField, Input } from '@/components/ui'
import { authApi } from '../api/auth.api'
import { getAuthErrorMessage } from '../auth.errors'
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from '../schemas/auth.schemas'
import styles from './auth.module.css'

const neutralMessage =
  'Si existe una cuenta asociada a ese correo, recibirás instrucciones para continuar.'
export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const mutation = useMutation({
    mutationFn: (input: ForgotPasswordValues) => authApi.forgotPassword(input),
    onSuccess: () => setSent(true),
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })
  const submit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values)
    } catch {
      // La mutación conserva el error seguro que renderiza el formulario.
    }
  })
  if (sent)
    return (
      <p className={styles.success} role="status">
        {neutralMessage}
      </p>
    )
  return (
    <form
      className={styles.form}
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      {mutation.error && (
        <p className={styles.generalError} role="alert">
          {getAuthErrorMessage(mutation.error)}
        </p>
      )}
      <FormField
        label="Correo electrónico"
        htmlFor="forgot-email"
        required
        error={errors.email?.message}
      >
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          {...register('email')}
        />
      </FormField>
      <Button
        className={styles.submit}
        type="submit"
        loading={mutation.isPending}
      >
        Enviar instrucciones
      </Button>
    </form>
  )
}
