import type { Artist, ArtistPlaylist, Festival, DayLineup } from '../types'
import ArtistPlaylistPanel from './ArtistPlaylistPanel'
import { officialArtistName } from '../lib/artistOfficialName'

interface PlaylistMobileDockProps {
  open: boolean
  onOpen: () => void
  onClose: () => void
  festival: Festival
  activeDay?: DayLineup
  selectedArtist: Artist | null
  artistPlaylist: ArtistPlaylist | null
  playlistLoading: boolean
  playlistReady: Set<string>
  bundleLoading: 'day' | 'festival' | 'custom' | null
  headlinerIds?: Set<string>
  onCloseArtist: () => void
  onOpenBundled: (kind: 'day' | 'festival', artistIds: string[], title: string) => void
  onOpenMyPlaylist?: () => void
  myLineupCount?: number
  artists: import('../types').Artist[]
  showMyLineupEditor?: boolean
  myLineupIds?: string[]
  onToggleMyLineup?: (artistId: string) => void
  onClearMyLineup?: () => void
  onPlayMyLineup?: () => void
  onToggleMyLineupFromArtist?: (artistId: string) => void
  isInMyLineup?: (artistId: string) => boolean
  bundleNotice?: import('../lib/bundlePlaylist').BundledAnonymousPlaylist | null
  onDismissBundleNotice?: () => void
}

/** Fixed playlist FAB — opens the listen hub (day / festival / my). */
export default function PlaylistMobileDock({
  open,
  onOpen,
  onClose,
  onCloseArtist,
  showMyLineupEditor = false,
  ...panelProps
}: PlaylistMobileDockProps) {
  return (
    <div className="playlist-dock">
      <button
        type="button"
        className={`playlist-fab${open ? ' is-open' : ''}`}
        onClick={() => (open ? onClose() : onOpen())}
        aria-expanded={open}
        aria-controls="playlist-sheet"
        aria-label="플레이리스트 듣기"
        title="플레이리스트 듣기"
      >
        <svg
          className="playlist-fab__glyph"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="2.5" y="5.5" width="11" height="2.2" rx="1.1" fill="currentColor" />
          <rect x="2.5" y="10.9" width="11" height="2.2" rx="1.1" fill="currentColor" />
          <rect x="2.5" y="16.3" width="8" height="2.2" rx="1.1" fill="currentColor" />
          <circle cx="17.2" cy="17" r="2.6" fill="currentColor" />
          <rect x="19" y="5" width="1.7" height="12.2" rx="0.6" fill="currentColor" />
          <path
            fill="currentColor"
            d="M20.7 5c.1 2.4 1.6 3.6 3.1 4v1.9c-2-.6-3.8-2.1-4.6-4.4V5h1.5z"
          />
        </svg>
      </button>

      {open && (
        <div className="playlist-sheet-root">
          <button
            type="button"
            className="playlist-sheet__backdrop"
            aria-label="플레이리스트 닫기"
            onClick={onClose}
          />
          <div
            id="playlist-sheet"
            className={`playlist-sheet${showMyLineupEditor ? ' playlist-sheet--lineup' : ''}${panelProps.selectedArtist ? ' playlist-sheet--artist' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              showMyLineupEditor
                ? '나만의 플레이리스트'
                : panelProps.selectedArtist
                  ? `${officialArtistName(panelProps.selectedArtist)} 플레이리스트`
                  : '플레이리스트'
            }
          >
            <div className="playlist-sheet__handle" aria-hidden="true" />
            <ArtistPlaylistPanel
              {...panelProps}
              showMyLineupEditor={showMyLineupEditor}
              onCloseArtist={onCloseArtist}
            />
          </div>
        </div>
      )}
    </div>
  )
}
