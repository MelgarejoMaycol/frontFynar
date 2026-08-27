import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button, FormField, Input, PasswordInput } from '@/components/ui'
import { getAuthErrorMessage } from '../auth.errors'
import { useLogin } from '../hooks/auth.hooks'
import { loginSchema, type LoginValues } from '../schemas/auth.schemas'
import { safeInternalRedirect } from '../redirect'
import styles from './auth.module.css'
import { authApi } from '../api/auth.api'
import { ApiError } from '@/services/http/httpErrors'
import { GoogleButton } from './GoogleButton'

export function LoginForm() {
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const submit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values)
      const from = (location.state as { from?: unknown } | null)?.from
      navigate(safeInternalRedirect(from), { replace: true })
    } catch (error: unknown) {
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED')
        navigate(
          `/verify-email/pending?email=${encodeURIComponent(values.email)}`,
        )
      // La mutación conserva el error seguro que renderiza el formulario.
    }
  })
  return (
    <form
      className={styles.form}
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      {login.error && (
        <p className={styles.generalError} role="alert">
          {getAuthErrorMessage(login.error, 'login')}
        </p>
      )}
      <FormField
        label="Correo electrónico"
        htmlFor="login-email"
        required
        error={errors.email?.message}
      >
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          {...register('email')}
        />
      </FormField>
      <FormField
        label="Contraseña"
        htmlFor="login-password"
        required
        error={errors.password?.message}
      >
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          {...register('password')}
        />
      </FormField>
      <p className={styles.formLink}>
        <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
      </p>
      <Button className={styles.submit} type="submit" loading={login.isPending}>
        Iniciar sesión
      </Button>
      <div className={styles.oauthDivider}>
        <span>o continúa con</span>
      </div>
      <GoogleButton
        disabled={login.isPending}
        onClick={() => window.location.assign(authApi.googleUrl())}
      />
    </form>
  )
}
