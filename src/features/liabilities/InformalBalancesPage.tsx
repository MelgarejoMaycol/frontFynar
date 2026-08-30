import { useActiveWorkspace } from '@/features/workspace'
import { ModulePageHeader } from './ModulePageHeader'
import { InformalBalancesPanel } from './InformalBalancesPanel'
import styles from './informal-balances.module.css'

export function InformalBalancesPage() {
  const { activeWorkspace } = useActiveWorkspace()
  return (
    <div className={styles.panel}>
      <ModulePageHeader title="Debo y me deben" />
      <InformalBalancesPanel
        workspaceId={activeWorkspace!.id}
        currency={activeWorkspace!.baseCurrency}
      />
    </div>
  )
}
