import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router'
import { useActiveWorkspace } from '@/features/workspace'
import { LiabilitiesPage as BaseLiabilitiesPage } from './LiabilitiesPage'
import { RecurringSuggestionsPanel } from './RecurringSuggestionsPanel'

function RecurringSuggestionsPortal() {
  const { activeWorkspace } = useActiveWorkspace()
  const [params] = useSearchParams()
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const isObligationsTab = params.get('tab') === 'obligations'

  useLayoutEffect(() => {
    if (!isObligationsTab) {
      setHost(null)
      return
    }

    let container: HTMLDivElement | null = null
    let observer: MutationObserver | null = null

    const mount = () => {
      if (container?.isConnected) return true
      const statusTabs = document.querySelector<HTMLElement>(
        '[aria-label="Estado de pagos recurrentes"]',
      )
      if (!statusTabs?.parentElement) return false

      container = document.createElement('div')
      container.dataset.recurringSuggestionsHost = 'true'
      statusTabs.parentElement.insertBefore(container, statusTabs)
      setHost(container)
      return true
    }

    if (!mount()) {
      observer = new MutationObserver(() => {
        if (mount()) observer?.disconnect()
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }

    return () => {
      observer?.disconnect()
      container?.remove()
      setHost(null)
    }
  }, [isObligationsTab])

  if (!host || !activeWorkspace || !isObligationsTab || !host.isConnected) return null

  return createPortal(
    <RecurringSuggestionsPanel
      workspaceId={activeWorkspace.id}
      currency={activeWorkspace.baseCurrency}
    />,
    host,
  )
}

export function LiabilitiesPageWithSuggestions() {
  return (
    <>
      <BaseLiabilitiesPage />
      <RecurringSuggestionsPortal />
    </>
  )
}
