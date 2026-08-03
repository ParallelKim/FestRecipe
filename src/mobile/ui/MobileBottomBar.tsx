import { ChevronDownIcon, MoreVerticalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  listenScopeLabel,
  type ListenScope,
} from '../hooks/useMobileListenScope'

interface MobileBottomBarProps {
  scope: ListenScope
  dayLabel: string
  onScopeChange: (scope: ListenScope) => void
  canPlay: boolean
  loading: boolean
  onPlay: () => void
  dayReady: boolean
  festivalReady: boolean
  customReady: boolean
  wallpaperAvailable: boolean
  canClearLineup: boolean
  onOpenLineup: () => void
  onClearLineup: () => void
  onWallpaper: () => void
}

const SCOPES: ListenScope[] = ['day', 'festival', 'custom']

function scopeReadyLabel(
  scope: ListenScope,
  dayReady: boolean,
  festivalReady: boolean,
  customReady: boolean,
): string {
  if (scope === 'day') return dayReady ? '대표곡 묶음' : '준비 중'
  if (scope === 'festival') return festivalReady ? '전체 라인업' : '준비 중'
  return customReady ? '담은 팀만' : '담은 팀 없음'
}

export default function MobileBottomBar({
  scope,
  dayLabel,
  onScopeChange,
  canPlay,
  loading,
  onPlay,
  dayReady,
  festivalReady,
  customReady,
  wallpaperAvailable,
  canClearLineup,
  onOpenLineup,
  onClearLineup,
  onWallpaper,
}: MobileBottomBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 flex items-center gap-2 border-t border-border bg-background px-4 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.06)]"
      role="region"
      aria-label="듣기 및 메뉴"
    >
      <ButtonGroup className="flex-1 rounded-xl bg-primary text-primary-foreground">
        <Button
          type="button"
          variant="default"
          disabled={loading || !canPlay}
          onClick={onPlay}
          className="h-auto min-h-11 min-w-0 flex-1 flex-col items-start justify-center gap-0.5 rounded-none border-0 bg-transparent px-3.5 py-2 text-left text-primary-foreground hover:bg-primary/90"
        >
          <span className="text-sm font-extrabold leading-tight">
            {loading ? '여는 중…' : '듣기'}
          </span>
          <span className="text-[11px] font-semibold leading-tight opacity-85">
            {listenScopeLabel(scope, dayLabel)}
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 rounded-none border-0 border-l border-primary-foreground/25 text-primary-foreground hover:bg-primary/90"
              />
            }
            aria-label="듣기 범위 선택"
          >
            <ChevronDownIcon aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="min-w-[220px]">
            <DropdownMenuRadioGroup
              value={scope}
              onValueChange={(value) => onScopeChange(value as ListenScope)}
            >
              {SCOPES.map((s) => (
                <DropdownMenuRadioItem
                  key={s}
                  value={s}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="font-bold">{listenScopeLabel(s, dayLabel)}</span>
                  <span className="text-xs text-muted-foreground">
                    {scopeReadyLabel(s, dayReady, festivalReady, customReady)}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 rounded-xl"
            />
          }
          aria-label="더보기"
        >
          <MoreVerticalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="min-w-[220px]">
          <DropdownMenuItem
            className="flex items-center justify-between gap-3 py-2.5"
            onClick={onOpenLineup}
          >
            <span className="font-bold">내 라인업</span>
            <span className="text-xs text-muted-foreground">{dayLabel} 담은 팀</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center justify-between gap-3 py-2.5"
            disabled={!canClearLineup}
            onClick={onClearLineup}
          >
            <span className="font-bold">{dayLabel} 비우기</span>
            <span className="text-xs text-muted-foreground">라인업에서 제거</span>
          </DropdownMenuItem>
          {wallpaperAvailable && (
            <DropdownMenuItem
              className="flex items-center justify-between gap-3 py-2.5"
              onClick={onWallpaper}
            >
              <span className="font-bold">배경화면 만들기</span>
              <span className="text-xs text-muted-foreground">타임테이블 PNG</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
