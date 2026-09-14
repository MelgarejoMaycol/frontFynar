import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { PageLoader } from '@/components/feedback/PageLoader'
import { activateDemoSession } from './demo-session'
import { resetDemoDatabase } from './demo-backend'

export function DemoLoginPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  useEffect(() => {
    resetDemoDatabase()
    activateDemoSession(queryClient)
    navigate('/app/dashboard', { replace: true })
  }, [navigate, queryClient])

  return <PageLoader />
}
