/** 모바일 하단 바·시트 공통 드롭다운 패널 */
export const mobileDropdownContentClass =
  'min-w-[280px] w-max max-w-[calc(100vw-2rem)] p-1.5'

/** 드롭다운·메뉴 항목 2줄 레이아웃 (라벨 + 보조 설명) */
export function MobileMenuOption({
  label,
  hint,
}: {
  label: string
  hint: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 py-0.5">
      <span className="text-sm font-semibold leading-tight">{label}</span>
      <span className="text-xs leading-tight text-muted-foreground">{hint}</span>
    </div>
  )
}
