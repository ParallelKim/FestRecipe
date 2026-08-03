import type { MobileArtistView, MobilePlaylistView } from '../view/types'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

interface MobileArtistSheetProps {
  open: boolean
  artist: MobileArtistView | null
  inLineup: boolean
  loading: boolean
  playlist: MobilePlaylistView | null
  listenUrl: string | null
  onClose: () => void
  onToggleLineup: () => void
}

export default function MobileArtistSheet({
  open,
  artist,
  inLineup,
  loading,
  playlist,
  listenUrl,
  onClose,
  onToggleLineup,
}: MobileArtistSheetProps) {
  if (!artist) return null

  const tracks = playlist?.tracks ?? []

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="bottom"
        className="m-sheet mx-auto gap-0 data-[side=bottom]:border-t-0"
      >
        <SheetTitle className="sr-only">{artist.displayName} 대표곡</SheetTitle>
        <div className="m-sheet__handle" aria-hidden="true" />

        <h2 className="m-sheet__title m-sheet__title--solo">{artist.displayName}</h2>

        {loading && <p className="m-muted">대표곡 불러오는 중…</p>}
        {!loading && tracks.length === 0 && (
          <p className="m-muted">대표곡 준비 중이에요.</p>
        )}

        {!loading && tracks.length > 0 && (
          <div className="m-listen-block">
            <p className="m-sheet__meta">{tracks.length}곡 · YouTube</p>
            <div className="m-sheet__actions">
              {listenUrl ? (
                <a
                  href={listenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="m-btn m-btn--primary m-sheet__play"
                >
                  YouTube로 듣기
                </a>
              ) : (
                <span className="m-btn m-btn--primary m-sheet__play is-disabled">
                  YouTube로 듣기
                </span>
              )}
              <button
                type="button"
                className={`m-star m-star--pill m-sheet__lineup${inLineup ? ' is-on' : ''}`}
                aria-pressed={inLineup}
                onClick={onToggleLineup}
              >
                {inLineup ? '★ 담김' : '☆ 담기'}
              </button>
            </div>
            <ol className="m-tracklist">
              {tracks.map((track, i) => (
                <li key={track.videoId} className="m-tracklist__item">
                  <span className="m-tracklist__num">{i + 1}</span>
                  <span className="m-tracklist__title">{track.title}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!loading && tracks.length === 0 && (
          <div className="m-sheet__actions m-sheet__actions--solo">
            <button
              type="button"
              className={`m-star m-star--pill m-sheet__lineup${inLineup ? ' is-on' : ''}`}
              aria-pressed={inLineup}
              onClick={onToggleLineup}
            >
              {inLineup ? '★ 담김' : '☆ 담기'}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
