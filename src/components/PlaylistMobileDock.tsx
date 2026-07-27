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
  onCloseArtist: () => void
  onOpenBundled: (kind: 'day' | 'festival', artistIds: string[], title: string) => void
}

export default function PlaylistMobileDock({
  open,
  onOpen,
  onClose,
  selectedArtist,
  onCloseArtist,
  ...panelProps
}: PlaylistMobileDockProps) {
  const fabLabel = selectedArtist
    ? `${selectedArtist.name} 플레이리스트`
    : '플레이리스트'

  return (
    <div className="playlist-dock">
      <button
        type="button"
        className={`playlist-fab${selectedArtist ? ' has-artist' : ''}${open ? ' is-open' : ''}`}
        onClick={() => (open ? onClose() : onOpen())}
        aria-expanded={open}
        aria-controls="playlist-sheet"
        aria-label={fabLabel}
      >
        {selectedArtist ? (
          <span className="playlist-fab__initial" aria-hidden="true">
            {selectedArtist.name.trim().charAt(0)}
          </span>
        ) : (
          <span className="playlist-fab__icon" aria-hidden="true">♪</span>
        )}
        <span className="playlist-fab__text">
          {selectedArtist ? '플레이리스트' : '듣기'}
        </span>
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
            aria-label={fabLabel}
          >
            <div className="playlist-sheet__handle" aria-hidden="true" />
            <ArtistPlaylistPanel
              {...panelProps}
              selectedArtist={selectedArtist}
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
