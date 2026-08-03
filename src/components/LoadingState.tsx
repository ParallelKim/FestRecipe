import { Spinner } from '@/components/ui/spinner'

interface LoadingStateProps {
  label?: string
  minHeight?: string | number
}

export default function LoadingState({
  label = '불러오는 중…',
  minHeight = 'calc(100vh - 64px)',
}: LoadingStateProps) {
  return (
    <div
      className="flex items-center justify-center bg-background"
      style={{ minHeight }}
    >
      <div className="flex flex-col items-center gap-4 text-center text-muted-foreground">
        <Spinner className="size-7 text-foreground" />
        <p className="text-lg font-semibold text-foreground">{label}</p>
      </div>
    </div>
  )
}
