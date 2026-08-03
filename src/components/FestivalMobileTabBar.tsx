type FestivalMobileTab = 'schedule' | 'listen'

interface FestivalMobileTabBarProps {
  active: FestivalMobileTab
  onChange: (tab: FestivalMobileTab) => void
  hidden?: boolean
  lineupCount?: number
  dayLabel?: string
}

/** 모바일 하단 탭 — 타임테이블 vs 듣기·라인업 (시트 없음) */
export default function FestivalMobileTabBar({
  active,
  onChange,
  hidden = false,
  lineupCount = 0,
  dayLabel = '오늘',
}: FestivalMobileTabBarProps) {
  if (hidden) return null

  return (
    <div className="festival-mobile-tab-bar-root">
      <nav className="festival-mobile-tab-bar" aria-label="페스티벌 화면">
        <button
          type="button"
          className={`festival-mobile-tab-bar__btn${active === 'schedule' ? ' is-active' : ''}`}
          aria-current={active === 'schedule' ? 'page' : undefined}
          onClick={() => onChange('schedule')}
        >
          <span className="festival-mobile-tab-bar__label">타임테이블</span>
          <span className="festival-mobile-tab-bar__meta">☆ 담기</span>
        </button>
        <button
          type="button"
          className={`festival-mobile-tab-bar__btn${active === 'listen' ? ' is-active' : ''}`}
          aria-current={active === 'listen' ? 'page' : undefined}
          onClick={() => onChange('listen')}
        >
          <span className="festival-mobile-tab-bar__label">듣기·라인업</span>
          <span className="festival-mobile-tab-bar__meta">
            {lineupCount > 0 ? `${dayLabel} ${lineupCount}팀` : '대표곡·목록'}
          </span>
        </button>
      </nav>
    </div>
  )
}
