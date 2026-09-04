import { useActiveWorkspace } from '@/features/workspace'
import { RecurringSuggestionsPanel } from '@/features/liabilities/RecurringSuggestionsPanel'
import { CommitmentsPage as BaseCommitmentsPage } from './CommitmentsPage'

export function CommitmentsPageWithSuggestions() {
  const { activeWorkspace } = useActiveWorkspace()

  return (
    <>
      <BaseCommitmentsPage />
      {activeWorkspace ? (
        <RecurringSuggestionsPanel
          workspaceId={activeWorkspace.id}
          currency={activeWorkspace.baseCurrency}
        />
      ) : null}
    </>
  )
}
