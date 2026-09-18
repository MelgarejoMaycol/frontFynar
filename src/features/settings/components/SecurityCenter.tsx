import { useState } from 'react'
import { Button, Input, PasswordInput } from '@/components/ui'
import {
  useConfirmMfa,
  useDisableMfa,
  useMfaStatus,
  useRegenerateRecoveryCodes,
  useRevokeOtherSecuritySessions,
  useRevokeSecuritySession,
  useSecuritySessions,
  useSetupMfa,
} from '../hooks/settings.hooks'
import styles from '@/features/auth/pages/settings.module.css'

const deviceLabel = (agent: string | null, fallback: string | null) => {
  if (fallback) return fallback
  if (!agent) return 'Dispositivo desconocido'
  const browser = agent.includes('Edg/')
    ? 'Microsoft Edge'
    : agent.includes('Chrome/')
      ? 'Chrome'
      : agent.includes('Safari/')
        ? 'Safari'
        : agent.includes('Firefox/')
          ? 'Firefox'
          : 'Navegador'
  const os = agent.includes('Windows')
    ? 'Windows'
    : agent.includes('iPhone')
      ? 'iPhone'
      : agent.includes('Android')
        ? 'Android'
        : agent.includes('Mac OS')
          ? 'macOS'
          : ''
  return [browser, os].filter(Boolean).join(' · ')
}

export function SecurityCenter() {
  const status = useMfaStatus()
  const setup = useSetupMfa()
  const confirm = useConfirmMfa()
  const disable = useDisableMfa()
  const regenerate = useRegenerateRecoveryCodes()
  const sessions = useSecuritySessions()
  const revoke = useRevokeSecuritySession()
  const revokeOthers = useRevokeOtherSecuritySessions()
  const [setupCode, setSetupCode] = useState('')
  const [setupPassword, setSetupPassword] = useState('')
  const [securityCode, setSecurityCode] = useState('')
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUri: string } | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])

  const startSetup = async () => {
    if (!setupPassword) return
    const { data } = await setup.mutateAsync(setupPassword)
    setSetupData(data)
    setSetupPassword('')
    setSetupCode('')
    setRecoveryCodes([])
  }

  const confirmSetup = async () => {
    if (!setupCode.trim()) return
    const { data } = await confirm.mutateAsync(setupCode.trim())
    setRecoveryCodes(data.recoveryCodes)
    setSetupData(null)
    setSetupCode('')
  }

  return (
    <div className={styles.securityCenter}>
      <div className={styles.securityBlock}>
        <div className={styles.securityTitleRow}>
          <div>
            <h3>Autenticación en dos pasos</h3>
            <p className={styles.help}>
              Añade un código temporal de una aplicación Authenticator al inicio
              de sesión con contraseña.
            </p>
          </div>
          <span className={status.data?.enabled ? styles.securityBadgeOn : styles.securityBadgeOff}>
            {status.data?.enabled ? 'Activa' : 'Desactivada'}
          </span>
        </div>

        {status.isPending ? (
          <p role="status">Consultando seguridad…</p>
        ) : status.data && !status.data.available ? (
          <p className={styles.help}>{status.data.unavailableReason}</p>
        ) : status.data?.enabled ? (
          <>
            <p className={styles.help}>
              Códigos de recuperación disponibles: {status.data.recoveryCodesRemaining}.
            </p>
            <div className={styles.securityInline}>
              <Input
                aria-label="Código para administrar 2FA"
                placeholder="Código Authenticator o recuperación"
                value={securityCode}
                onChange={(event) => setSecurityCode(event.target.value)}
                autoComplete="one-time-code"
              />
              <Button
                variant="secondary"
                loading={regenerate.isPending}
                onClick={async () => {
                  if (!securityCode.trim()) return
                  const { data } = await regenerate.mutateAsync(securityCode.trim())
                  setRecoveryCodes(data.recoveryCodes)
                  setSecurityCode('')
                }}
              >
                Nuevos códigos
              </Button>
              <Button
                variant="danger"
                loading={disable.isPending}
                onClick={async () => {
                  if (!securityCode.trim()) return
                  await disable.mutateAsync(securityCode.trim())
                  setSecurityCode('')
                  setRecoveryCodes([])
                }}
              >
                Desactivar 2FA
              </Button>
            </div>
          </>
        ) : setupData ? (
          <div className={styles.mfaSetup}>
            <p>
              Agrega Fynar en Google Authenticator, Microsoft Authenticator,
              2FAS u otra app compatible.
            </p>
            <a className={styles.mfaAuthenticatorLink} href={setupData.otpauthUri}>
              Abrir en mi aplicación Authenticator
            </a>
            <div className={styles.mfaSecret}>
              <span>Clave manual</span>
              <code>{setupData.secret}</code>
            </div>
            <div className={styles.securityInline}>
              <Input
                aria-label="Código de confirmación 2FA"
                placeholder="Código de 6 dígitos"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={setupCode}
                onChange={(event) => setSetupCode(event.target.value)}
              />
              <Button loading={confirm.isPending} onClick={() => void confirmSetup()}>
                Confirmar y activar
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.securityInline}>
            <PasswordInput
              aria-label="Contraseña actual para activar 2FA"
              placeholder="Confirma tu contraseña actual"
              autoComplete="current-password"
              value={setupPassword}
              onChange={(event) => setSetupPassword(event.target.value)}
            />
            <Button
              loading={setup.isPending}
              disabled={!setupPassword}
              onClick={() => void startSetup()}
            >
              Activar autenticación en dos pasos
            </Button>
          </div>
        )}

        {recoveryCodes.length > 0 && (
          <div className={styles.recoveryCodes} role="status">
            <strong>Guarda estos códigos de recuperación ahora</strong>
            <p>Cada código funciona una sola vez. No volverán a mostrarse.</p>
            <div>
              {recoveryCodes.map((code) => <code key={code}>{code}</code>)}
            </div>
          </div>
        )}
        {(setup.error || confirm.error || disable.error || regenerate.error) && (
          <p className={styles.error} role="alert">
            No fue posible completar la operación de seguridad. Revisa el código e inténtalo de nuevo.
          </p>
        )}
      </div>

      <div className={styles.securityBlock}>
        <div className={styles.securityTitleRow}>
          <div>
            <h3>Sesiones y dispositivos</h3>
            <p className={styles.help}>
              Revisa dónde está abierta tu cuenta y revoca dispositivos que no reconozcas.
            </p>
          </div>
          <Button
            variant="secondary"
            loading={revokeOthers.isPending}
            onClick={() => revokeOthers.mutate()}
          >
            Cerrar las demás
          </Button>
        </div>
        {sessions.isPending ? (
          <p role="status">Cargando sesiones…</p>
        ) : sessions.data?.length ? (
          <div className={styles.sessionList}>
            {sessions.data.map((session) => (
              <div className={styles.sessionItem} key={session.id}>
                <div>
                  <strong>{deviceLabel(session.userAgent, session.deviceName)}</strong>
                  <span>
                    {session.current ? 'Este dispositivo · ' : ''}
                    actividad {new Date(session.lastActivityAt).toLocaleString()}
                  </span>
                </div>
                {session.current ? (
                  <span className={styles.securityBadgeOn}>Actual</span>
                ) : (
                  <Button
                    variant="secondary"
                    loading={revoke.isPending && revoke.variables === session.id}
                    onClick={() => revoke.mutate(session.id)}
                  >
                    Cerrar sesión
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.help}>No hay otras sesiones activas.</p>
        )}
        {(sessions.error || revoke.error || revokeOthers.error) && (
          <p className={styles.error} role="alert">
            No pudimos actualizar las sesiones activas.
          </p>
        )}
      </div>
    </div>
  )
}
