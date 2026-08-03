interface MobileLineupDockProps {
  count: number
  loading: boolean
  onPlay: () => void
  onExpand: () => void
}

export default function MobileLineupDock({
  count,
  loading,
  onPlay,
  onExpand,
}: MobileLineupDockProps) {
  if (count === 0) return null

  return (
    <div className="m-dock" role="region" aria-label="내 라인업">
      <button type="button" className="m-dock__expand" onClick={onExpand}>
        <span className="m-dock__label">라인업 {count}팀</span>
        <span className="m-dock__chev" aria-hidden="true">▴</span>
      </button>
      <button
        type="button"
        className="m-dock__play"
        disabled={loading}
        onClick={onPlay}
      >
        {loading ? '여는 중…' : 'YouTube로'}
      </button>
    </div>
  )
}
