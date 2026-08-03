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
  onOpenLineup: () => void
  lineupCount: number
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
  onOpenLineup,
  lineupCount,
}: MobileArtistSheetProps) {
  if (!artist) return null

  const tracks = playlist?.tracks ?? []

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="m-sheet mx-auto gap-0 data-[side=bottom]:border-t-0"
      >
        <SheetTitle className="sr-only">{artist.displayName} 대표곡</SheetTitle>
        <div className="m-sheet__handle" aria-hidden="true" />

        <div className="m-sheet__toolbar">
          <button type="button" className="m-sheet__ghost" onClick={onClose}>
            닫기
          </button>
          {lineupCount > 0 && (
            <button type="button" className="m-sheet__link" onClick={onOpenLineup}>
              라인업 {lineupCount}팀
            </button>
          )}
        </div>

        <div className="m-sheet__hero">
          <h2 className="m-sheet__title">{artist.displayName}</h2>
          <button
            type="button"
            className={`m-star m-star--pill${inLineup ? ' is-on' : ''}`}
            aria-pressed={inLineup}
            onClick={onToggleLineup}
          >
            {inLineup ? '★ 담김' : '☆ 담기'}
          </button>
        </div>

        {loading && <p className="m-muted">대표곡 불러오는 중…</p>}
        {!loading && tracks.length === 0 && (
          <p className="m-muted">대표곡 준비 중이에요.</p>
        )}

        {!loading && tracks.length > 0 && (
          <div className="m-listen-block">
            <p className="m-sheet__meta">{tracks.length}곡 · YouTube</p>
            {listenUrl && (
              <a
                href={listenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="m-btn m-btn--primary m-btn--block"
              >
                YouTube로 듣기
              </a>
            )}
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
      </SheetContent>
    </Sheet>
  )
}
