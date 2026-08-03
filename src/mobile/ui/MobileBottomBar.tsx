import { Menu } from '@base-ui/react/menu'
import { ChevronDownIcon, MoreVerticalIcon } from 'lucide-react'
import {
  LISTEN_SCOPE_LABEL,
  type ListenScope,
} from '../hooks/useMobileListenScope'

interface MobileBottomBarProps {
  scope: ListenScope
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
    <div className="m-bar" role="region" aria-label="듣기 및 메뉴">
      <div className="m-listen">
        <button
          type="button"
          className="m-listen__play"
          disabled={loading || !canPlay}
          onClick={onPlay}
        >
          <span className="m-listen__primary">
            {loading ? '여는 중…' : '듣기'}
          </span>
          <span className="m-listen__scope">{LISTEN_SCOPE_LABEL[scope]}</span>
        </button>

        <Menu.Root>
          <Menu.Trigger
            className="m-listen__chev"
            aria-label="듣기 범위 선택"
          >
            <ChevronDownIcon aria-hidden="true" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className="m-menu__positioner" side="top" align="end">
              <Menu.Popup className="m-menu">
                <Menu.RadioGroup
                  value={scope}
                  onValueChange={(value) => onScopeChange(value as ListenScope)}
                >
                  {SCOPES.map((s) => (
                      <Menu.RadioItem
                        key={s}
                        value={s}
                        className="m-menu__item"
                      >
                        <span className="m-menu__item-label">
                          {LISTEN_SCOPE_LABEL[s]}
                        </span>
                        <span className="m-menu__item-hint">
                          {scopeReadyLabel(s, dayReady, festivalReady, customReady)}
                        </span>
                      </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>

      <Menu.Root>
        <Menu.Trigger className="m-bar__more" aria-label="더보기">
          <MoreVerticalIcon aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="m-menu__positioner" side="top" align="end">
            <Menu.Popup className="m-menu">
              <Menu.Item className="m-menu__item" onClick={onOpenLineup}>
                <span className="m-menu__item-label">내 라인업</span>
                <span className="m-menu__item-hint">이 날 담은 팀</span>
              </Menu.Item>
              <Menu.Item
                className="m-menu__item"
                disabled={!canClearLineup}
                onClick={onClearLineup}
              >
                <span className="m-menu__item-label">이 날 비우기</span>
                <span className="m-menu__item-hint">라인업에서 제거</span>
              </Menu.Item>
              {wallpaperAvailable && (
                <Menu.Item className="m-menu__item" onClick={onWallpaper}>
                  <span className="m-menu__item-label">배경화면 만들기</span>
                  <span className="m-menu__item-hint">타임테이블 PNG</span>
                </Menu.Item>
              )}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  )
}
