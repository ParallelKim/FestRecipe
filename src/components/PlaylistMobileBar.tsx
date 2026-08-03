import ListenActionSheet from './ListenActionSheet'
import LineupMobileSheet from './LineupMobileSheet'
import type { Artist, DayLineup, Festival } from '../types'
import type { BundledAnonymousPlaylist } from '../lib/bundlePlaylist'

interface PlaylistMobileBarProps {
  lineupOpen: boolean
  onLineupOpen: () => void
  onLineupClose: () => void
  listenOpen: boolean
  onListenOpen: () => void
  onListenClose: () => void
  barHidden: boolean
  festival: Festival
  activeDay?: DayLineup
  artists: Artist[]
  myLineupIds: string[]
  playlistReady: Set<string>
  bundleLoading: 'day' | 'festival' | 'custom' | null
  myLineupCount?: number
  onOpenBundled: (kind: 'day' | 'festival', artistIds: string[], title: string) => void
  onPlayMyLineup?: () => void
  onToggleMyLineup: (artistId: string) => void
  onSelectArtistFromLineup?: (artistId: string) => void
  onClearMyLineup: () => void
  bundleNotice?: BundledAnonymousPlaylist | null
  onDismissBundleNotice?: () => void
}

/**
 * 모바일 하단 고정 바 (FAB 없음).
 * 레퍼런스: 페스티벌 앱 bottom tab/bar, 음악 앱 mini-player dock.
 */
export default function PlaylistMobileBar({
  lineupOpen,
  onLineupOpen,
  onLineupClose,
  listenOpen,
  onListenOpen,
  onListenClose,
  barHidden,
  festival,
  activeDay,
  artists,
  myLineupIds,
  playlistReady,
  bundleLoading,
  myLineupCount = 0,
  onOpenBundled,
  onPlayMyLineup,
  onToggleMyLineup,
  onSelectArtistFromLineup,
  onClearMyLineup,
  bundleNotice = null,
  onDismissBundleNotice,
}: PlaylistMobileBarProps) {
  const dayLabel = activeDay?.dayLabel ?? '오늘'

  return (
    <div className="playlist-mobile-bar-root">
      {!barHidden && (
        <nav
          className="playlist-mobile-bar"
          aria-label="듣기·내 라인업"
        >
          <button
            type="button"
            className={`playlist-mobile-bar__btn playlist-mobile-bar__btn--lineup${lineupOpen ? ' is-active' : ''}`}
            aria-expanded={lineupOpen}
            onClick={onLineupOpen}
          >
            <span className="playlist-mobile-bar__label">내 라인업</span>
            <span className="playlist-mobile-bar__meta">
              {myLineupCount > 0 ? `${dayLabel} ${myLineupCount}팀` : '☆로 담기'}
            </span>
          </button>
          <button
            type="button"
            className={`playlist-mobile-bar__btn playlist-mobile-bar__btn--listen${listenOpen ? ' is-active' : ''}`}
            aria-expanded={listenOpen}
            onClick={onListenOpen}
          >
            <span className="playlist-mobile-bar__label">듣기</span>
            <span className="playlist-mobile-bar__meta">날짜·전체</span>
          </button>
        </nav>
      )}

      <LineupMobileSheet
        open={lineupOpen}
        onClose={onLineupClose}
        festival={festival}
        activeDay={activeDay}
        artists={artists}
        myLineupIds={myLineupIds}
        playlistReady={playlistReady}
        bundleLoading={bundleLoading === 'custom'}
        bundleNotice={bundleNotice}
        onToggleArtist={onToggleMyLineup}
        onSelectArtist={onSelectArtistFromLineup}
        onClear={onClearMyLineup}
        onPlayYouTube={onPlayMyLineup ?? (() => {})}
        onDismissBundleNotice={onDismissBundleNotice}
      />

      <ListenActionSheet
        open={listenOpen}
        onClose={onListenClose}
        festival={festival}
        activeDay={activeDay}
        playlistReady={playlistReady}
        bundleLoading={bundleLoading}
        myLineupCount={myLineupCount}
        onOpenBundled={onOpenBundled}
        onPlayMyLineup={onPlayMyLineup}
        bundleNotice={bundleNotice}
        onDismissBundleNotice={onDismissBundleNotice}
      />
    </div>
  )
}
