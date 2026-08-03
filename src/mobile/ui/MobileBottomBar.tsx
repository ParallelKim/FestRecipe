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
import { mobileDropdownContentClass, MobileMenuOption } from './MobileMenuOption'

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
      <ButtonGroup className="flex-1 overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-none">
        <Button
          type="button"
          variant="default"
          disabled={loading || !canPlay}
          onClick={onPlay}
          className="h-11 min-h-11 min-w-0 flex-1 flex-col items-start justify-center gap-0.5 rounded-none border-0 bg-transparent px-3.5 py-2 text-left text-primary-foreground hover:bg-primary/90 active:bg-primary/90"
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
                variant="default"
                size="icon"
                className="size-11 shrink-0 rounded-none border-0 bg-transparent text-primary-foreground hover:bg-primary/90 active:bg-primary/90"
              />
            }
            aria-label="듣기 범위 선택"
          >
            <ChevronDownIcon aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            sideOffset={10}
            className={`${mobileDropdownContentClass} border-border bg-popover text-popover-foreground`}
          >
            <DropdownMenuRadioGroup
              value={scope}
              onValueChange={(value) => onScopeChange(value as ListenScope)}
            >
              {SCOPES.map((s) => (
                <DropdownMenuRadioItem
                  key={s}
                  value={s}
                  className="items-start py-2.5 pr-8"
                >
                  <MobileMenuOption
                    label={listenScopeLabel(s, dayLabel)}
                    hint={scopeReadyLabel(s, dayReady, festivalReady, customReady)}
                  />
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
        <DropdownMenuContent
          side="top"
          align="end"
          sideOffset={10}
          className={mobileDropdownContentClass}
        >
          <DropdownMenuItem className="items-start py-2.5" onClick={onOpenLineup}>
            <MobileMenuOption label="내 라인업" hint={`${dayLabel} 담은 팀`} />
          </DropdownMenuItem>
          <DropdownMenuItem
            className="items-start py-2.5"
            disabled={!canClearLineup}
            onClick={onClearLineup}
          >
            <MobileMenuOption label={`${dayLabel} 비우기`} hint="라인업에서 제거" />
          </DropdownMenuItem>
          {wallpaperAvailable && (
            <DropdownMenuItem className="items-start py-2.5" onClick={onWallpaper}>
              <MobileMenuOption label="배경화면 만들기" hint="타임테이블 PNG" />
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
