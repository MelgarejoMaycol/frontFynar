import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { Button, FormField, Input, PasswordInput } from '@/components/ui'
import { getAuthErrorMessage } from '../auth.errors'
import { useRegister } from '../hooks/auth.hooks'
import { registerSchema, type RegisterValues } from '../schemas/auth.schemas'
import styles from './auth.module.css'

export function RegisterForm() {
  const mutation = useRegister()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })
  const submit = handleSubmit(
    async ({ firstName, lastName, email, password }) => {
      try {
        await mutation.mutateAsync({ firstName, lastName, email, password })
        navigate('/app/dashboard', { replace: true })
      } catch {
        // La mutación conserva el error seguro que renderiza el formulario.
      }
    },
  )
  return (
    <form
      className={styles.form}
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      {mutation.error && (
        <p className={styles.generalError} role="alert">
          {getAuthErrorMessage(mutation.error, 'register')}
        </p>
      )}
      <div className={styles.row}>
        <FormField
          label="Nombre"
          htmlFor="register-first-name"
          required
          error={errors.firstName?.message}
        >
          <Input
            id="register-first-name"
            autoComplete="given-name"
            {...register('firstName')}
          />
        </FormField>
        <FormField
          label="Apellido"
          htmlFor="register-last-name"
          required
          error={errors.lastName?.message}
        >
          <Input
            id="register-last-name"
            autoComplete="family-name"
            {...register('lastName')}
          />
        </FormField>
      </div>
      <FormField
        label="Correo electrónico"
        htmlFor="register-email"
        required
        error={errors.email?.message}
      >
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          {...register('email')}
        />
      </FormField>
      <FormField
        label="Contraseña"
        htmlFor="register-password"
        required
        helpText="Usa entre 10 y 128 caracteres."
        error={errors.password?.message}
      >
        <PasswordInput
          id="register-password"
          autoComplete="new-password"
          {...register('password')}
        />
      </FormField>
      <FormField
        label="Confirmar contraseña"
        htmlFor="register-confirm-password"
        required
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="register-confirm-password"
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
      </FormField>
      <Button
        className={styles.submit}
        type="submit"
        loading={mutation.isPending}
      >
        Crear cuenta
      </Button>
    </form>
  )
}
