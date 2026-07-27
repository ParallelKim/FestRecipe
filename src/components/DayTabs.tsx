interface DayTabsProps {
  days: Array<{ date: string; dayLabel: string }>
  activeIndex: number
  onChange: (index: number) => void
}

export default function DayTabs({ days, activeIndex, onChange }: DayTabsProps) {
  return (
    <div className="day-tabs" role="tablist" aria-label="페스티벌 일자">
      {days.map((day, idx) => {
        const active = activeIndex === idx
        return (
          <button
            key={day.date}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(idx)}
            className={`day-tab${active ? ' is-active' : ''}`}
          >
            {day.dayLabel}
          </button>
        )
      })}
    </div>
  )
}
