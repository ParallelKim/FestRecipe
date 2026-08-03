import type { MobileArtistView } from '../view/types'

interface MobileArtistListProps {
  artistIds: string[]
  artists: Map<string, MobileArtistView>
  playlistReady: Set<string>
  lineupIds: string[]
  selectedArtistId?: string
  onArtistClick: (artistId: string) => void
  onToggleLineup: (artistId: string) => void
}

export default function MobileArtistList({
  artistIds,
  artists,
  playlistReady,
  lineupIds,
  selectedArtistId,
  onArtistClick,
  onToggleLineup,
}: MobileArtistListProps) {
  return (
    <ul className="m-artist-list">
      {artistIds.map((id) => {
        const artist = artists.get(id)
        if (!artist) return null
        const ready = playlistReady.has(id)
        const inLineup = lineupIds.includes(id)
        return (
          <li key={id} className="m-artist-list__row">
            <button
              type="button"
              className={`m-artist-list__main${selectedArtistId === id ? ' is-selected' : ''}`}
              onClick={() => onArtistClick(id)}
            >
              <span className="m-artist-list__name">{artist.displayName}</span>
              <span className="m-artist-list__meta">
                {ready ? '대표곡 준비' : '준비 중'}
              </span>
            </button>
            <button
              type="button"
              className={`m-star${inLineup ? ' is-on' : ''}`}
              aria-pressed={inLineup}
              aria-label={inLineup ? '내 라인업에서 빼기' : '내 라인업에 담기'}
              onClick={() => onToggleLineup(id)}
            >
              {inLineup ? '★' : '☆'}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
