import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { CheckCircle2, Mail, TriangleAlert } from 'lucide-react'
import { Button, Card, Input, PageHeader } from '@/components/ui'
import { useResendVerification, useVerifyEmail } from '../hooks/auth.hooks'
import { ApiError } from '@/services/http/httpErrors'
import { authApi } from '../api/auth.api'
import { useAuthStore } from '../store/auth.store'
import styles from '../components/auth.module.css'

export function VerificationPendingPage() {
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const resend = useResendVerification()
  const [remaining, setRemaining] = useState(0)
  useEffect(() => {
    if (remaining <= 0) return
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [remaining])
  return <section className={styles.statusPage}>
    <Mail size={42} aria-hidden="true" />
    <PageHeader title="Revisa tu correo" description={email ? `Te enviamos un enlace de verificación a ${email}.` : 'Te enviamos un enlace de verificación.'} />
    <Card>
      <p>Abre el enlace del correo para activar tu cuenta. También revisa la carpeta de spam.</p>
      {!params.get('email') && (
        <label>
          Correo electrónico
          <Input
            aria-label="Correo electrónico"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.com"
          />
        </label>
      )}
      {resend.isSuccess && <p className={styles.success} role="status">Si el registro continúa pendiente, enviaremos un nuevo enlace.</p>}
      {resend.isError && <p className={styles.generalError} role="alert">No pudimos reenviar el correo. Inténtalo más tarde.</p>}
      <div className={styles.statusActions}>
        <Button disabled={!email || remaining > 0} loading={resend.isPending} onClick={() => resend.mutate(email, { onSuccess: () => setRemaining(60) })}>
          {remaining > 0 ? `Reenviar en ${remaining}s` : 'Reenviar correo'}
        </Button>
        <Link to="/register">Corregir correo</Link>
        <Link to="/login">Volver a iniciar sesión</Link>
      </div>
    </Card>
  </section>
}

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const verify = useVerifyEmail()
  const mutateVerification = verify.mutate
  const started = useRef(false)
  useEffect(() => {
    if (started.current || !token) return
    started.current = true
    mutateVerification(token)
  }, [token, mutateVerification])
  useEffect(() => {
    if (!token || !verify.isPending) return
    const retry = window.setTimeout(() => mutateVerification(token), 8_000)
    return () => window.clearTimeout(retry)
  }, [token, verify.isPending, mutateVerification])
  const code = verify.error instanceof ApiError ? verify.error.code : ''
  const alreadyVerified = code === 'VERIFICATION_TOKEN_USED'
  const verified = verify.isSuccess || alreadyVerified
  const missingToken = !token
  return <section className={styles.statusPage}>
    {verify.isPending ? <Mail size={42} aria-hidden="true" /> : verified ? <CheckCircle2 size={42} aria-hidden="true" /> : <TriangleAlert size={42} aria-hidden="true" />}
    <PageHeader
      title={verify.isPending ? 'Verificando tu correo' : verified ? 'Correo verificado' : 'No pudimos verificar el correo'}
      description={verify.isPending ? 'Espera un momento mientras validamos el enlace.' : verified ? 'Tu correo está verificado. Inicia sesión para continuar.' : missingToken ? 'El enlace de verificación está incompleto.' : code === 'VERIFICATION_TOKEN_EXPIRED' ? 'El enlace ha expirado.' : 'El enlace no es válido.'}
    />
    {!verify.isPending && <Button onClick={() => window.location.assign(verified ? '/login' : '/verify-email/pending')}>{verified ? 'Iniciar sesión' : 'Reenviar verificación'}</Button>}
  </section>
}

export function GoogleCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const started = useRef(false)
  const callbackError =
    params.get('status') === 'success'
      ? null
      : (params.get('code') ?? 'GOOGLE_OAUTH_INVALID')
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const error = callbackError ?? refreshError

  useEffect(() => {
    if (started.current || callbackError) return
    started.current = true
    void authApi
      .refresh()
      .then(({ data }) => {
        useAuthStore.getState().setAccessToken(data.accessToken)
        navigate('/app', { replace: true })
      })
      .catch(() => setRefreshError('GOOGLE_OAUTH_INVALID'))
  }, [callbackError, navigate])
  return <section className={styles.statusPage}><PageHeader title={error ? 'No pudimos continuar con Google' : 'Completando acceso'} description={error === 'LEGAL_ACCEPTANCE_REQUIRED' ? 'Para crear una cuenta con Google debes aceptar los términos y la política de privacidad.' : error ? 'Vuelve a intentarlo desde la pantalla de acceso.' : 'Estamos preparando tu sesión de Fynar.'} />{error && <Button onClick={() => navigate(error === 'LEGAL_ACCEPTANCE_REQUIRED' ? '/register' : '/login')}>Volver</Button>}</section>
}
