type FmTab = 'schedule' | 'plan'

interface FmNextTabBarProps {
  active: FmTab
  onChange: (tab: FmTab) => void
  hidden?: boolean
  lineupCount?: number
}

export default function FmNextTabBar({
  active,
  onChange,
  hidden = false,
  lineupCount = 0,
}: FmNextTabBarProps) {
  if (hidden) return null

  return (
    <nav className="fm2-tabbar" aria-label="페스티벌 화면">
      <button
        type="button"
        className={`fm2-tabbar__btn${active === 'schedule' ? ' is-active' : ''}`}
        aria-current={active === 'schedule' ? 'page' : undefined}
        onClick={() => onChange('schedule')}
      >
        <span className="fm2-tabbar__label">스케줄</span>
        <span className="fm2-tabbar__meta">타임테이블</span>
      </button>
      <button
        type="button"
        className={`fm2-tabbar__btn${active === 'plan' ? ' is-active' : ''}`}
        aria-current={active === 'plan' ? 'page' : undefined}
        onClick={() => onChange('plan')}
      >
        <span className="fm2-tabbar__label">계획</span>
        <span className="fm2-tabbar__meta">
          {lineupCount > 0 ? `라인업 ${lineupCount}팀` : '듣기·배경화면'}
        </span>
      </button>
    </nav>
  )
}
