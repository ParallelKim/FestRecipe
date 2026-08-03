import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface MobileDayBarProps {
  days: { id: string; label: string }[]
  activeId: string
  onChange: (id: string) => void
}

/** 기존 데스크톱 `day-tab` 스타일 — 선택 상태가 명확한 폴더 탭 */
export default function MobileDayBar({ days, activeId, onChange }: MobileDayBarProps) {
  if (days.length <= 1) return null

  return (
    <Tabs value={activeId} onValueChange={onChange}>
      <TabsList
        variant="line"
        className="day-tabs m-0 w-full max-w-full justify-start p-0"
        aria-label="페스티벌 일자"
      >
        {days.map((day) => (
          <TabsTrigger key={day.id} value={day.id} className="day-tab">
            {day.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
