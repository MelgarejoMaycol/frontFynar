import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Button, PageHeader } from '@/components/ui'
import { settingsApi } from '@/features/settings/api/settings.api'
import styles from '../components/auth.module.css'

export function EmailChangePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const started = useRef(false)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  )
  useEffect(() => {
    if (started.current) return
    started.current = true
    void settingsApi
      .confirmEmailChange({ token: params.get('token') ?? '' })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [params])
  return (
    <section className={styles.statusPage}>
      <PageHeader
        title={
          status === 'loading'
            ? 'Confirmando nuevo correo'
            : status === 'success'
              ? 'Correo actualizado'
              : 'No pudimos cambiar el correo'
        }
        description={
          status === 'loading'
            ? 'Espera un momento.'
            : status === 'success'
              ? 'Ya puedes iniciar sesión con tu nuevo correo.'
              : 'El enlace es inválido, expiró o ya fue utilizado.'
        }
      />
      {status !== 'loading' && (
        <Button
          onClick={() =>
            navigate(status === 'success' ? '/login' : '/app/settings')
          }
        >
          Continuar
        </Button>
      )}
    </section>
  )
}
