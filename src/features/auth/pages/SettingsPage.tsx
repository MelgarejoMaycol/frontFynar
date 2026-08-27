import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Button,
  Card,
  Dialog,
  Input,
  PageHeader,
  SectionHeader,
} from '@/components/ui'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useToast } from '@/components/feedback/toast-context'
import { ChangePasswordForm } from '@/features/settings/components/ChangePasswordForm'
import { AvatarUploader } from '@/features/settings/components/AvatarUploader'
import { ProfileForm } from '@/features/settings/components/ProfileForm'
import { PreferencesForm } from '@/features/settings/components/PreferencesForm'
import {
  useProfile,
  useChangePassword,
  useDeleteAccount,
  useUpdateProfile,
} from '@/features/settings/hooks/settings.hooks'
import {
  useActiveWorkspace,
  usePreferences,
  useUpdatePreferences,
  WorkspaceSelector,
} from '@/features/workspace'
import { getAuthErrorMessage } from '../auth.errors'
import { getSettingsErrorMessage } from '@/features/settings/settings.errors'
import { useLogout, useLogoutAll } from '../hooks/auth.hooks'
import styles from './settings.module.css'

export function SettingsPage() {
  const [confirmAll, setConfirmAll] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false),
    [deleteText, setDeleteText] = useState(''),
    profile = useProfile(),
    updateProfile = useUpdateProfile(),
    changePassword = useChangePassword(),
    workspaceQuery = useActiveWorkspace(),
    preferencesQuery = usePreferences(),
    updatePreferences = useUpdatePreferences(),
    logout = useLogout(),
    logoutAll = useLogoutAll(),
    deleteAccount = useDeleteAccount(),
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
        {profile.isPending ? (
          <p role="status">Cargando perfil…</p>
        ) : profile.isError ? (
          <ErrorState
            title="No pudimos consultar tu perfil"
            message={getSettingsErrorMessage(profile.error)}
            onRetry={() => void profile.refetch()}
          />
        ) : user ? (
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
        ) : null}
      </Card>
      <Card className={styles.section} id="preferences" tabIndex={-1}>
        <SectionHeader
          title="Apariencia y preferencias"
          description="Personaliza la apariencia y los valores predeterminados."
        />
        {preferencesQuery.isPending ? (
          <p role="status">Cargando preferencias…</p>
        ) : preferencesQuery.isError ? (
          <ErrorState
            title="No pudimos consultar las preferencias"
            message={getSettingsErrorMessage(preferencesQuery.error)}
            onRetry={() => void preferencesQuery.refetch()}
          />
        ) : preferences ? (
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
        ) : null}
      </Card>
      <Card className={styles.section}>
        <SectionHeader
          title="Espacio financiero"
          description="Espacio donde se administra tu información financiera."
        />
        {workspaceQuery.isPending ? (
          <p role="status">Cargando espacio financiero…</p>
        ) : workspaceQuery.isError ? (
          <ErrorState
            title="No pudimos consultar el espacio financiero"
            message={getSettingsErrorMessage(workspaceQuery.error)}
            onRetry={() => void workspaceQuery.refetch()}
          />
        ) : (
          <>
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
          </>
        )}
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
      <Card className={`${styles.section} ${styles.dangerZone}`}>
        <SectionHeader
          title="Eliminar mi cuenta"
          description="Desactiva tu acceso y elimina o anonimiza tus datos personales."
        />
        <div className={styles.actions}>
          <div>
            <h3>Eliminación irreversible</h3>
            <p>
              Se revocarán todas las sesiones. El historial financiero se
              conservará anonimizado cuando sea necesario para mantener su
              integridad.
            </p>
          </div>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Eliminar mi cuenta
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
      <Dialog
        open={confirmDelete}
        title="Eliminar mi cuenta"
        onClose={() => {
          if (deleteAccount.isPending) return
          setConfirmDelete(false)
          setDeleteText('')
        }}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={deleteAccount.isPending}
              onClick={() => {
                setConfirmDelete(false)
                setDeleteText('')
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={deleteAccount.isPending}
              disabled={deleteText !== 'ELIMINAR'}
              onClick={() =>
                deleteAccount.mutate(undefined, {
                  onSuccess: () => {
                    showToast('Tu cuenta fue eliminada.')
                    navigate('/', { replace: true })
                  },
                })
              }
            >
              Eliminar definitivamente
            </Button>
          </>
        }
      >
        <div className={styles.deleteConfirmation}>
          <p>
            Esta acción eliminará o anonimizará tus datos personales y
            financieros según la política de retención. Esta acción no se puede
            deshacer.
          </p>
          <label htmlFor="delete-account-confirmation">
            Escribe <strong>ELIMINAR</strong> para confirmar
          </label>
          <Input
            id="delete-account-confirmation"
            autoComplete="off"
            value={deleteText}
            onChange={(event) => setDeleteText(event.target.value)}
            aria-describedby={
              deleteAccount.isError ? 'delete-account-error' : undefined
            }
          />
          {deleteAccount.isError && (
            <p id="delete-account-error" className={styles.error} role="alert">
              No fue posible eliminar la cuenta. Inténtalo nuevamente.
            </p>
          )}
        </div>
      </Dialog>
    </div>
  )
}
