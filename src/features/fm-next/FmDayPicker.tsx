import type { DayLineup } from '../../types'

interface FmDayPickerProps {
  days: DayLineup[]
  activeIndex: number
  onChange: (index: number) => void
}

/** 일자 선택 — shadcn Tabs 없이 단순 pill */
export default function FmDayPicker({ days, activeIndex, onChange }: FmDayPickerProps) {
  if (days.length <= 1) return null

  return (
    <div className="fm2-daypick" role="tablist" aria-label="페스티벌 일자">
      {days.map((day, idx) => (
        <button
          key={day.date}
          type="button"
          role="tab"
          aria-selected={idx === activeIndex}
          className={`fm2-daypick__btn${idx === activeIndex ? ' is-active' : ''}`}
          onClick={() => onChange(idx)}
        >
          {day.dayLabel}
        </button>
      ))}
    </div>
  )
}
