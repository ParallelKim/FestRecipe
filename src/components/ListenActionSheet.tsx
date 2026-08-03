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
  onOpenBundled: (kind: 'day' | 'festival', artistIds: string[], title: string) => void
  bundleNotice?: BundledAnonymousPlaylist | null
  onDismissBundleNotice?: () => void
}

/** 하단 바 → 날짜·전체 대표곡만 (라인업은 라인업 시트) */
export default function ListenActionSheet({
  open,
  onClose,
  festival,
  activeDay,
  playlistReady,
  bundleLoading,
  onOpenBundled,
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
