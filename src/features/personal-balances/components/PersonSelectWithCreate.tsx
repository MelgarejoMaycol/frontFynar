import { useState, type KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button, Dialog, Input, Select } from '@/components/ui'
import { useCreatePerson, usePeople } from '../hooks'
import styles from './person-select.module.css'

export function PersonSelectWithCreate({
  workspaceId,
  value,
  onChange,
  disabled = false,
  required = false,
  label = 'Persona',
}: {
  workspaceId: string
  value: string
  onChange: (personId: string) => void
  disabled?: boolean
  required?: boolean
  label?: string
}) {
  const people = usePeople(workspaceId)
  const create = useCreatePerson(workspaceId)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')

  const submit = () => {
    const cleanName = name.trim()
    if (!cleanName) return
    create.mutate(
      { name: cleanName, relationship: relationship.trim() || null },
      {
        onSuccess: ({ data }) => {
          onChange(data.id)
          setName('')
          setRelationship('')
          setOpen(false)
        },
      },
    )
  }

  return (
    <div className={styles.root}>
      <label>
        <span>{label}</span>
        <Select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled || people.isPending}
          required={required}
        >
          <option value="">
            {people.isPending ? 'Cargando personas…' : 'Selecciona una persona'}
          </option>
          {(people.data ?? []).map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
              {person.relationship ? ` · ${person.relationship}` : ''}
            </option>
          ))}
        </Select>
      </label>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Plus size={16} aria-hidden="true" /> Agregar persona
      </Button>
      {people.isError ? (
        <p className={styles.error} role="alert">
          No fue posible cargar las personas.
        </p>
      ) : null}
      <Dialog
        open={open}
        title="Agregar persona"
        onClose={() => setOpen(false)}
      >
        <div
          className={styles.form}
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key !== 'Enter' || create.isPending) return
            event.preventDefault()
            submit()
          }}
        >
          <label>
            <span>Nombre</span>
            <Input
              autoFocus
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. David"
            />
          </label>
          <label>
            <span>Relación (opcional)</span>
            <Input
              value={relationship}
              onChange={(event) => setRelationship(event.target.value)}
              placeholder="Ej. Amigo, familiar o cliente"
            />
          </label>
          {create.isError ? (
            <p className={styles.error} role="alert">
              {create.error.message}
            </p>
          ) : null}
          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              loading={create.isPending}
              disabled={!name.trim()}
              onClick={submit}
            >
              Guardar persona
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
