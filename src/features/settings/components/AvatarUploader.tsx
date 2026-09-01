import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { ImageUp, Pencil, X } from 'lucide-react'
import clsx from 'clsx'
import { Avatar, Button } from '@/components/ui'
import { useToast } from '@/components/feedback/toast-context'
import type { AuthUser } from '@/features/auth/types/auth.types'
import { useUpdateAvatar } from '../hooks/settings.hooks'
import styles from '@/features/auth/pages/settings.module.css'

const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxBytes = 5 * 1024 * 1024

export function AvatarUploader({ user }: { user: AuthUser }) {
  const [file, setFile] = useState<File | null>(null)
  const [editing, setEditing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUpdateAvatar()
  const { showToast } = useToast()
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')

  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  )
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  const resetEditor = () => {
    setFile(null)
    setValidationError(null)
    setDragActive(false)
    setEditing(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const selectFile = (candidate?: File) => {
    setValidationError(null)
    if (!candidate) return
    if (!acceptedTypes.has(candidate.type)) {
      setFile(null)
      setValidationError('Selecciona una imagen JPG, PNG o WEBP.')
      return
    }
    if (candidate.size > maxBytes) {
      setFile(null)
      setValidationError('La imagen no puede superar los 5 MB.')
      return
    }
    setFile(candidate)
  }
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
    selectFile(event.dataTransfer.files[0])
  }

  return (
    <section className={styles.avatarSection} aria-labelledby="avatar-title">
      <div className={styles.avatarHeader}>
        <div className={styles.avatarIdentity}>
          <Avatar name={fullName} src={preview ?? user.avatarUrl ?? undefined} />
          <div>
            <h3 id="avatar-title">Foto de perfil</h3>
            <p>{fullName}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className={styles.avatarEditButton}
          onClick={() => (editing ? resetEditor() : setEditing(true))}
        >
          {editing ? <X size={15} aria-hidden="true" /> : <Pencil size={15} aria-hidden="true" />}
          {editing ? 'Cerrar' : 'Editar imagen'}
        </Button>
      </div>

      {editing && (
        <div className={styles.avatarEditor}>
          <div
            className={clsx(styles.dropzone, dragActive && styles.dropzoneActive)}
            onDragEnter={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node))
                setDragActive(false)
            }}
            onDrop={drop}
          >
            <ImageUp size={22} aria-hidden="true" />
            <div>
              <strong>{dragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen'}</strong>
              <small>JPG, PNG o WEBP · Máx. 5 MB</small>
            </div>
            <label className={styles.fileButton} htmlFor="profile-avatar-file">
              Seleccionar
            </label>
            <input
              ref={inputRef}
              className={styles.fileInput}
              id="profile-avatar-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={upload.isPending}
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
          </div>
          {validationError && (
            <p className={styles.error} role="alert">
              {validationError}
            </p>
          )}
          {file && (
            <div className={styles.avatarActions}>
              <span>{file.name}</span>
              <Button
                className={styles.avatarSaveButton}
                loading={upload.isPending}
                disabled={upload.isPending}
                onClick={() =>
                  upload.mutate(file, {
                    onSuccess: () => {
                      resetEditor()
                      showToast('Foto de perfil actualizada.')
                    },
                    onError: () =>
                      showToast(
                        'No fue posible actualizar la foto de perfil.',
                        'error',
                      ),
                  })
                }
              >
                Guardar foto
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
