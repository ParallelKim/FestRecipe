import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface MobileDayBarProps {
  days: { id: string; label: string }[]
  activeId: string
  onChange: (id: string) => void
}

/** shadcn Tabs `folder` variant — 선택 상태가 명확한 일자 폴더 탭 */
export default function MobileDayBar({ days, activeId, onChange }: MobileDayBarProps) {
  if (days.length <= 1) return null

  return (
    <Tabs value={activeId} onValueChange={onChange}>
      <TabsList
        variant="folder"
        className="m-0 w-full max-w-full justify-start"
        aria-label="페스티벌 일자"
      >
        {days.map((day) => (
          <TabsTrigger key={day.id} value={day.id}>
            {day.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
