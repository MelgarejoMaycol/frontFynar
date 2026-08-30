import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button, Card, Checkbox, PageHeader } from '@/components/ui'
import { authApi } from '../api/auth.api'
import { useAuthStore } from '../store/auth.store'
import styles from '../components/auth.module.css'

const GOOGLE_PENDING_STORAGE_KEY = 'fynar_google_pending'

function readGooglePendingToken(): string {
  const hash = window.location.hash.replace(/^#/, '')
  const tokenFromHash = new URLSearchParams(hash).get('pending')?.trim() ?? ''
  const storedToken = sessionStorage.getItem(GOOGLE_PENDING_STORAGE_KEY)?.trim() ?? ''
  const pendingToken = tokenFromHash || storedToken

  if (tokenFromHash) {
    sessionStorage.setItem(GOOGLE_PENDING_STORAGE_KEY, tokenFromHash)
    window.history.replaceState(
      window.history.state,
      document.title,
      `${window.location.pathname}${window.location.search}`,
    )
  }

  return pendingToken
}

function clearGooglePendingToken(): void {
  sessionStorage.removeItem(GOOGLE_PENDING_STORAGE_KEY)
}

export function GoogleLegalPage() {
  const navigate = useNavigate()
  const [pendingToken] = useState(readGooglePendingToken)
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [failed, setFailed] = useState(false)

  const complete = async () => {
    if (!terms || !privacy || submitting) return
    if (!pendingToken) {
      setFailed(true)
      return
    }

    setSubmitting(true)
    setFailed(false)
    try {
      const { data } = await authApi.completeGoogleRegistration({
        acceptedTerms: true,
        acceptedPrivacy: true,
        pendingToken,
      })
      clearGooglePendingToken()
      useAuthStore.getState().setAccessToken(data.tokens.accessToken)
      navigate('/app', { replace: true })
    } catch {
      setFailed(true)
      setSubmitting(false)
    }
  }

  const cancel = () => {
    clearGooglePendingToken()
    navigate('/login')
  }

  return (
    <section className={styles.statusPage}>
      <PageHeader
        title="Antes de continuar"
        description="Para crear tu cuenta en Fynar debes aceptar las condiciones de la plataforma."
      />
      <Card>
        <div className={styles.googleLegalForm}>
          <Checkbox
            checked={terms}
            onChange={(event) => setTerms(event.target.checked)}
            label={
              <span>
                Acepto los{' '}
                <Link to="/terms" target="_blank">
                  Términos y Condiciones
                </Link>
                .
              </span>
            }
          />
          <Checkbox
            checked={privacy}
            onChange={(event) => setPrivacy(event.target.checked)}
            label={
              <span>
                Acepto la{' '}
                <Link to="/privacy" target="_blank">
                  Política de Privacidad
                </Link>
                .
              </span>
            }
          />
          {failed && (
            <p className={styles.generalError} role="alert">
              No pudimos completar el registro. Inicia el proceso nuevamente.
            </p>
          )}
          <div className={styles.googleLegalActions}>
            <Button
              disabled={!terms || !privacy || !pendingToken}
              loading={submitting}
              onClick={() => void complete()}
            >
              Continuar
            </Button>
            <Button
              variant="secondary"
              disabled={submitting}
              onClick={cancel}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Card>
    </section>
  )
}
