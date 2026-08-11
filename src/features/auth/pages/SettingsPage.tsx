import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Button,
  Card,
  Dialog,
  PageHeader,
  SectionHeader,
} from '@/components/ui'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useToast } from '@/components/feedback/toast-context'
import { ChangePasswordForm } from '@/features/settings/components/ChangePasswordForm'
import { AvatarUploader } from '@/features/settings/components/AvatarUploader'
import { ProfileForm } from '@/features/settings/components/ProfileForm'
import { PreferencesForm } from '@/features/settings/components/PreferencesForm'
import {
  useProfile,
  useChangePassword,
  useUpdateProfile,
} from '@/features/settings/hooks/settings.hooks'
import {
  useActiveWorkspace,
  usePreferences,
  useUpdatePreferences,
  WorkspaceSelector,
} from '@/features/workspace'
import { getAuthErrorMessage } from '../auth.errors'
import { useLogout, useLogoutAll } from '../hooks/auth.hooks'
import styles from './settings.module.css'

export function SettingsPage() {
  const [confirmAll, setConfirmAll] = useState(false),
    profile = useProfile(),
    updateProfile = useUpdateProfile(),
    changePassword = useChangePassword(),
    workspaceQuery = useActiveWorkspace(),
    preferencesQuery = usePreferences(),
    updatePreferences = useUpdatePreferences(),
    logout = useLogout(),
    logoutAll = useLogoutAll(),
    navigate = useNavigate(),
    workspace = workspaceQuery.activeWorkspace,
    user = profile.data,
    preferences = preferencesQuery.data,
    fullName = user
      ? [user.firstName, user.lastName].filter(Boolean).join(' ')
      : '',
    { showToast } = useToast()

  const roleLabels: Record<string, string> = {
    OWNER: 'Propietario',
    ADMIN: 'Administrador',
    MEMBER: 'Miembro',
    VIEWER: 'Lector',
    ACCOUNTANT: 'Contador',
    ADVISOR: 'Asesor',
  }

  if (
    workspaceQuery.isPending ||
    preferencesQuery.isPending ||
    profile.isPending
  )
    return <PageLoader />
  if (workspaceQuery.isError || preferencesQuery.isError || profile.isError)
    return (
      <ErrorState
        title="No pudimos cargar la configuración"
        message="Comprueba tu conexión e inténtalo nuevamente."
        onRetry={() => {
          void workspaceQuery.refetch()
          void preferencesQuery.refetch()
          void profile.refetch()
        }}
      />
    )

  return (
    <div className={styles.page}>
      <PageHeader
        title="Configuración"
        description="Administra tu perfil, preferencias y seguridad."
      />
      <Card className={styles.section}>
        <SectionHeader
          title="Perfil"
          description={`Sesión de ${fullName}. Correo ${user?.isEmailVerified ? 'verificado' : 'pendiente de verificación'}.`}
        />
        {user && (
          <>
            <AvatarUploader user={user} />
            <ProfileForm
              key={user.updatedAt}
              user={user}
              pending={updateProfile.isPending}
              error={updateProfile.error}
              onSubmit={(input) => {
                updateProfile.mutate(input, {
                  onSuccess: () => showToast('Perfil actualizado.'),
                  onError: () =>
                    showToast('No fue posible actualizar el perfil.', 'error'),
                })
              }}
            />
          </>
        )}
      </Card>
      <Card className={styles.section}>
        <SectionHeader
          title="Apariencia y preferencias"
          description="Personaliza la apariencia y los valores predeterminados."
        />
        {preferences && (
          <PreferencesForm
            key={preferences.updatedAt}
            preferences={preferences}
            pending={updatePreferences.isPending}
            error={updatePreferences.error}
            onSubmit={(input) => {
              updatePreferences.mutate(input, {
                onSuccess: () => showToast('Preferencias guardadas.'),
                onError: () =>
                  showToast(
                    'No fue posible guardar las preferencias.',
                    'error',
                  ),
              })
            }}
          />
        )}
      </Card>
      <Card className={styles.section}>
        <SectionHeader
          title="Espacio financiero"
          description="Espacio donde se administra tu información financiera."
        />
        <WorkspaceSelector />
        <dl className={styles.details}>
          <div>
            <dt>Espacio activo</dt>
            <dd>{workspace?.name ?? 'Sin espacio activo'}</dd>
          </div>
          <div>
            <dt>Rol</dt>
            <dd>
              {workspace?.role
                ? (roleLabels[workspace.role] ?? workspace.role)
                : 'No disponible'}
            </dd>
          </div>
          <div>
            <dt>Moneda base</dt>
            <dd>{workspace?.baseCurrency ?? 'No disponible'}</dd>
          </div>
          <div>
            <dt>Zona horaria</dt>
            <dd>{workspace?.timezone ?? 'No disponible'}</dd>
          </div>
        </dl>
      </Card>
      <Card className={styles.section}>
        <SectionHeader
          title="Seguridad"
          description="Controla las sesiones activas de tu cuenta."
        />
        <div className={styles.securityBlock}>
          <h3>Cambiar contraseña</h3>
          <p className={styles.help}>
            Al cambiarla se cerrarán las demás sesiones y se conservará esta.
          </p>
          <ChangePasswordForm
            pending={changePassword.isPending}
            error={changePassword.error}
            onSubmit={(value, reset) =>
              changePassword.mutate(
                {
                  currentPassword: value.currentPassword,
                  newPassword: value.newPassword,
                },
                {
                  onSuccess: () => {
                    reset()
                    showToast('Contraseña actualizada correctamente.')
                  },
                  onError: () =>
                    showToast('No fue posible cambiar la contraseña.', 'error'),
                },
              )
            }
          />
        </div>
        {logoutAll.error && (
          <p className={styles.error} role="alert">
            {getAuthErrorMessage(logoutAll.error)}
          </p>
        )}
        <div className={styles.actions}>
          <div>
            <h3>Cerrar sesión actual</h3>
            <p>Cierra la sesión de este navegador.</p>
          </div>
          <Button
            variant="secondary"
            loading={logout.isPending}
            onClick={() =>
              logout.mutate(undefined, {
                onSettled: () => navigate('/login', { replace: true }),
              })
            }
          >
            Cerrar sesión
          </Button>
        </div>
        <div className={styles.actions}>
          <div>
            <h3>Cerrar todas las sesiones</h3>
            <p>Revoca el acceso en todos los dispositivos.</p>
          </div>
          <Button variant="danger" onClick={() => setConfirmAll(true)}>
            Cerrar todas
          </Button>
        </div>
      </Card>
      <Dialog
        open={confirmAll}
        title="Cerrar todas las sesiones"
        onClose={() => !logoutAll.isPending && setConfirmAll(false)}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={logoutAll.isPending}
              onClick={() => setConfirmAll(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={logoutAll.isPending}
              onClick={() =>
                logoutAll.mutate(undefined, {
                  onSuccess: () => {
                    showToast('Sesiones cerradas.')
                    navigate('/login', { replace: true })
                  },
                })
              }
            >
              Confirmar cierre
            </Button>
          </>
        }
      >
        Esto cerrará tu sesión en todos los dispositivos donde hayas iniciado
        sesión.
      </Dialog>
    </div>
  )
}
