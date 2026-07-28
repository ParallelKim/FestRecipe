import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DayTabsProps {
  days: Array<{ date: string; dayLabel: string }>
  activeIndex: number
  onChange: (index: number) => void
}

export default function DayTabs({ days, activeIndex, onChange }: DayTabsProps) {
  return (
    <Tabs
      value={String(activeIndex)}
      onValueChange={(value) => onChange(Number(value))}
    >
      <TabsList variant="line" className="day-tabs p-0" aria-label="페스티벌 일자">
        {days.map((day, idx) => (
          <TabsTrigger key={day.date} value={String(idx)} className="day-tab">
            {day.dayLabel}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
