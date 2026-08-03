import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface MobileDayBarProps {
  days: { id: string; label: string }[]
  activeId: string
  onChange: (id: string) => void
}

export default function MobileDayBar({ days, activeId, onChange }: MobileDayBarProps) {
  if (days.length <= 1) return null

  return (
    <ToggleGroup
      value={[activeId]}
      onValueChange={(values) => {
        const next = values[0]
        if (next) onChange(next)
      }}
      variant="outline"
      spacing={2}
      className="flex flex-wrap gap-2"
      aria-label="페스티벌 일자"
    >
      {days.map((day) => (
        <ToggleGroupItem
          key={day.id}
          value={day.id}
          className="rounded-full px-3.5 py-2 text-[13px] font-bold data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {day.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
