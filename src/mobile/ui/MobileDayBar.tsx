interface MobileDayBarProps {
  days: { id: string; label: string }[]
  activeId: string
  onChange: (id: string) => void
}

export default function MobileDayBar({ days, activeId, onChange }: MobileDayBarProps) {
  if (days.length <= 1) return null

  return (
    <div className="m-daybar" role="tablist" aria-label="페스티벌 일자">
      {days.map((day) => (
        <button
          key={day.id}
          type="button"
          role="tab"
          aria-selected={day.id === activeId}
          className={`m-daybar__btn${day.id === activeId ? ' is-active' : ''}`}
          onClick={() => onChange(day.id)}
        >
          {day.label}
        </button>
      ))}
    </div>
  )
}
