import { Spinner } from '@/components/ui/Spinner'

interface LoadingSpinnerProps {
  label?: string
  size?: 'small' | 'medium' | 'large'
}

export function LoadingSpinner({
  label = 'Cargando',
  size = 'medium',
}: LoadingSpinnerProps) {
  return <Spinner size={size} label={label} />
}
