import type { Artist, ArtistPlaylist, Festival, DayLineup } from '../types'
import ArtistPlaylistPanel from './ArtistPlaylistPanel'

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
  bundleLoading: 'day' | 'festival' | null
  headlinerIds?: Set<string>
  onCloseArtist: () => void
  onOpenBundled: (kind: 'day' | 'festival', artistIds: string[], title: string) => void
}

/** Fixed playlist FAB — later doubles as entry to the user's saved playlists. */
export default function PlaylistMobileDock({
  open,
  onOpen,
  onClose,
  onCloseArtist,
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
        aria-label="플레이리스트"
        title="플레이리스트"
      >
        <svg
          className="playlist-fab__glyph"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="currentColor"
            d="M4 6.5h11a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2Zm0 4.5h11a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2Zm0 4.5h7a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2Z"
          />
          <path
            fill="currentColor"
            d="M17.25 13.2v-5.1a1 1 0 0 1 1.35-.94l2.2.82a1 1 0 0 1 .65.94v5.48a2.25 2.25 0 1 1-1.5-2.12v3.07a.75.75 0 0 0 1.5 0v-1.15a.75.75 0 0 0-.75-.75h-.7a.75.75 0 0 0-.75.75Z"
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
            className="playlist-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="플레이리스트"
          >
            <div className="playlist-sheet__handle" aria-hidden="true" />
            <ArtistPlaylistPanel
              {...panelProps}
              onCloseArtist={() => {
                onCloseArtist()
                onClose()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
