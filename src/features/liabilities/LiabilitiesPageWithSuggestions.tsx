import { useSearchParams } from 'react-router'
import { useActiveWorkspace } from '@/features/workspace'
import { LiabilitiesPage as BaseLiabilitiesPage } from './LiabilitiesPage'
import { RecurringSuggestionsPanel } from './RecurringSuggestionsPanel'

export function LiabilitiesPageWithSuggestions() {
  const { activeWorkspace } = useActiveWorkspace()
  const [params] = useSearchParams()
  const isObligationsTab = params.get('tab') === 'obligations'

  return (
    <>
      <BaseLiabilitiesPage />
      {activeWorkspace && isObligationsTab ? (
        <RecurringSuggestionsPanel
          workspaceId={activeWorkspace.id}
          currency={activeWorkspace.baseCurrency}
        />
      ) : null}
    </>
  )
}
