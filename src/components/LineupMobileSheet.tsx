import type { Artist, DayLineup, Festival } from '../types'
import type { BundledAnonymousPlaylist } from '../lib/bundlePlaylist'
import MyLineupPanel from './MyLineupPanel'
import WallpaperMobileSection from './WallpaperMobileSection'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

interface LineupMobileSheetProps {
  open: boolean
  onClose: () => void
  festival: Festival
  activeDay?: DayLineup
  artists: Artist[]
  myLineupIds: string[]
  playlistReady: Set<string>
  bundleLoading: boolean
  bundleNotice: BundledAnonymousPlaylist | null
  onToggleArtist: (artistId: string) => void
  onSelectArtist?: (artistId: string) => void
  onClear: () => void
  onPlayYouTube: () => void
  onDismissBundleNotice?: () => void
}

/** 하단 바 → 내 라인업·배경화면 (메인 스크롤 밖) */
export default function LineupMobileSheet({
  open,
  onClose,
  festival,
  activeDay,
  artists,
  myLineupIds,
  playlistReady,
  bundleLoading,
  bundleNotice,
  onToggleArtist,
  onSelectArtist,
  onClear,
  onPlayYouTube,
  onDismissBundleNotice,
}: LineupMobileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="playlist-sheet playlist-sheet--lineup mx-auto gap-0 overscroll-contain data-[side=bottom]:border-t-0 min-[900px]:hidden"
      >
        <SheetTitle className="sr-only">내 라인업</SheetTitle>
        <div className="playlist-sheet__handle" aria-hidden="true" />

        <header className="playlist-sheet__actions-header">
          <h3 className="playlist-sheet__actions-title">내 라인업</h3>
          <button
            type="button"
            className="playlist-sheet__close"
            onClick={onClose}
            aria-label="시트 닫기"
          >
            닫기
          </button>
        </header>

        <MyLineupPanel
          festival={festival}
          activeDay={activeDay}
          artists={artists}
          myLineupIds={myLineupIds}
          playlistReady={playlistReady}
          bundleLoading={bundleLoading}
          bundleNotice={bundleNotice}
          onToggleArtist={onToggleArtist}
          onSelectArtist={onSelectArtist}
          onClear={onClear}
          onPlayYouTube={onPlayYouTube}
          onDismissBundleNotice={onDismissBundleNotice}
          suppressTitle
          showWallpaper={false}
        />

        <WallpaperMobileSection
          festival={festival}
          activeDay={activeDay}
          artists={artists}
          myLineupIds={myLineupIds}
          embedded
        />
      </SheetContent>
    </Sheet>
  )
}
