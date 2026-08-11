import { Select } from '@/components/ui'
import {
  useActiveWorkspace,
  useSelectWorkspace,
} from '../hooks/workspace.hooks'
import styles from './workspace.module.css'

export function WorkspaceSelector() {
  const {
    data = [],
    activeWorkspace,
    isPending,
    isError,
  } = useActiveWorkspace()
  const selection = useSelectWorkspace()
  if (isPending)
    return <span className={styles.status}>Cargando workspace…</span>
  if (isError)
    return <span className={styles.status}>Workspace no disponible</span>
  if (!activeWorkspace)
    return <span className={styles.status}>Sin workspace</span>
  if (data.length === 1) {
    return (
      <span className={styles.current} title={activeWorkspace.name}>
        {activeWorkspace.name}
      </span>
    )
  }
  return (
    <label className={styles.selector}>
      <span className={styles.srOnly}>Workspace activo</span>
      <Select
        aria-label="Workspace activo"
        value={activeWorkspace.id}
        disabled={selection.isPending}
        onChange={(event) => selection.mutate(event.target.value)}
      >
        {data.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name} · {workspace.type}
          </option>
        ))}
      </Select>
    </label>
  )
}
