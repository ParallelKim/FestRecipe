interface LoadingStateProps {
  label?: string
  minHeight?: string | number
}

export default function LoadingState({
  label = '불러오는 중...',
  minHeight = 'calc(100vh - 64px)',
}: LoadingStateProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-canvas)',
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
        <span className="loading-spinner" aria-hidden="true" />
        <p className="text-title-sm" style={{ margin: '16px 0 0' }}>{label}</p>
      </div>
    </div>
  )
}
