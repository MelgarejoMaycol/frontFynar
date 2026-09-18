import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { MonitorPlay } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button, FormField, Input, PasswordInput } from '@/components/ui'
import { getAuthErrorMessage } from '../auth.errors'
import { authMeKey, useLogin } from '../hooks/auth.hooks'
import { loginSchema, type LoginValues } from '../schemas/auth.schemas'
import { safeInternalRedirect } from '../redirect'
import styles from './auth.module.css'
import { authApi } from '../api/auth.api'
import { ApiError } from '@/services/http/httpErrors'
import { GoogleButton } from './GoogleButton'
import { activateDemoSession } from '@/features/demo/demo-session'
import { resetDemoDatabase } from '@/features/demo/demo-backend'
import { useAuthStore } from '../store/auth.store'

export function LoginForm() {
  const login = useLogin()
  const queryClient = useQueryClient()
  const [mfaChallenge, setMfaChallenge] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaPending, setMfaPending] = useState(false)
  const [mfaError, setMfaError] = useState<string | null>(null)
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
  const enterDemo = () => {
    resetDemoDatabase()
    activateDemoSession(queryClient)
    navigate('/app/dashboard', { replace: true })
  }

  const submit = handleSubmit(async (values) => {
    try {
      const response = await login.mutateAsync(values)
      if ('requiresMfa' in response.data && response.data.requiresMfa) {
        setMfaChallenge(response.data.challengeToken)
        setMfaCode('')
        setMfaError(null)
        return
      }
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
  if (mfaChallenge) {
    const verify = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!mfaCode.trim()) return
      setMfaPending(true)
      setMfaError(null)
      try {
        const { data } = await authApi.verifyMfa({
          challengeToken: mfaChallenge,
          code: mfaCode.trim(),
        })
        useAuthStore.getState().setAccessToken(data.tokens.accessToken)
        queryClient.setQueryData(authMeKey, data.user)
        const from = (location.state as { from?: unknown } | null)?.from
        navigate(safeInternalRedirect(from), { replace: true })
      } catch (error: unknown) {
        setMfaError(getAuthErrorMessage(error, 'login'))
      } finally {
        setMfaPending(false)
      }
    }
    return (
      <form className={styles.form} onSubmit={(event) => void verify(event)}>
        <div>
          <h2>Verificación en dos pasos</h2>
          <p>
            Escribe el código de 6 dígitos de tu aplicación de autenticación o
            uno de tus códigos de recuperación.
          </p>
        </div>
        {mfaError && (
          <p className={styles.generalError} role="alert">{mfaError}</p>
        )}
        <FormField label="Código de seguridad" htmlFor="login-mfa-code" required>
          <Input
            id="login-mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={mfaCode}
            onChange={(event) => setMfaCode(event.target.value)}
            autoFocus
          />
        </FormField>
        <Button className={styles.submit} type="submit" loading={mfaPending}>
          Verificar e iniciar sesión
        </Button>
        <Button
          variant="secondary"
          type="button"
          disabled={mfaPending}
          onClick={() => {
            setMfaChallenge(null)
            setMfaCode('')
            setMfaError(null)
          }}
        >
          Volver
        </Button>
      </form>
    )
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      <section className={styles.demoLoginAccess} aria-label="Acceso a la demo">
        <div className={styles.demoLoginCopy}>
          <span className={styles.demoLoginIcon}>
            <MonitorPlay size={22} aria-hidden="true" />
          </span>
          <div>
            <strong>Probar Fynar con una cuenta demo</strong>
            <span>
              Entra de inmediato con datos preparados y usa la aplicación como
              una cuenta normal.
            </span>
          </div>
        </div>
        <Button
          className={styles.demoLoginButton}
          type="button"
          onClick={enterDemo}
        >
          Entrar al modo demo
        </Button>
      </section>
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
