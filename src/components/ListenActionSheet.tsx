import type { Festival, DayLineup } from '../types'
import type { BundledAnonymousPlaylist } from '../lib/bundlePlaylist'
import { bundleNoticeCopy } from '../lib/bundlePlaylist'
import PlaylistHubActions from './PlaylistHubActions'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

interface ListenActionSheetProps {
  open: boolean
  onClose: () => void
  festival: Festival
  activeDay?: DayLineup
  playlistReady: Set<string>
  bundleLoading: 'day' | 'festival' | 'custom' | null
  myLineupCount?: number
  onOpenBundled: (kind: 'day' | 'festival', artistIds: string[], title: string) => void
  onPlayMyLineup?: () => void
  bundleNotice?: BundledAnonymousPlaylist | null
  onDismissBundleNotice?: () => void
}

/** FAB → 짧은 액션 시트 (날짜·전체·라인업 듣기). 탭·내비 없음. */
export default function ListenActionSheet({
  open,
  onClose,
  festival,
  activeDay,
  playlistReady,
  bundleLoading,
  myLineupCount = 0,
  onOpenBundled,
  onPlayMyLineup,
  bundleNotice = null,
  onDismissBundleNotice,
}: ListenActionSheetProps) {
  const notice = bundleNotice ? bundleNoticeCopy(bundleNotice) : null

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="playlist-sheet playlist-sheet--actions mx-auto gap-0 overscroll-contain data-[side=bottom]:border-t-0 min-[900px]:hidden"
      >
        <SheetTitle className="sr-only">대표곡 듣기</SheetTitle>
        <div className="playlist-sheet__handle" aria-hidden="true" />

        <header className="playlist-sheet__actions-header">
          <h3 className="playlist-sheet__actions-title">대표곡 듣기</h3>
          <button
            type="button"
            className="playlist-sheet__close"
            onClick={onClose}
            aria-label="시트 닫기"
          >
            닫기
          </button>
        </header>

        <PlaylistHubActions
          festival={festival}
          activeDay={activeDay}
          playlistReady={playlistReady}
          bundleLoading={bundleLoading}
          onOpenBundled={onOpenBundled}
          showLabel={false}
          showMyPlaylist={false}
          variant="actions"
        />

        {myLineupCount > 0 && onPlayMyLineup && (
          <div className="listen-action-sheet__lineup">
            <Button
              variant="outline"
              className="listen-action-sheet__lineup-btn"
              disabled={bundleLoading === 'custom'}
              onClick={onPlayMyLineup}
            >
              {bundleLoading === 'custom'
                ? '여는 중…'
                : `내 라인업 (${myLineupCount}) YouTube로`}
            </Button>
            <p className="listen-action-sheet__lineup-hint">
              담은 목록은 타임테이블 아래에서 편집할 수 있어요.
            </p>
          </div>
        )}

        {notice && (
          <div
            className={`playlist-bundle-notice${bundleNotice?.truncated || bundleNotice?.thinCoverage ? ' is-warn' : ''}`}
            role="status"
          >
            <h4 className="playlist-bundle-notice__title">{notice.title}</h4>
            <p className="playlist-bundle-notice__body">{notice.body}</p>
            {onDismissBundleNotice && (
              <Button
                variant="outline"
                className="playlist-bundle-notice__dismiss"
                onClick={onDismissBundleNotice}
              >
                확인
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
