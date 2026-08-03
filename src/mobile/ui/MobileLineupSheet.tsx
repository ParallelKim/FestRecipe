import type { MobileArtistView } from '../view/types'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

interface MobileLineupSheetProps {
  open: boolean
  dayLabel: string
  artistIds: string[]
  artists: Map<string, MobileArtistView>
  playlistReady: Set<string>
  onClose: () => void
  onRemove: (artistId: string) => void
  onArtistClick: (artistId: string) => void
}

export default function MobileLineupSheet({
  open,
  dayLabel,
  artistIds,
  artists,
  playlistReady,
  onClose,
  onRemove,
  onArtistClick,
}: MobileLineupSheetProps) {
  const readyCount = artistIds.filter((id) => playlistReady.has(id)).length
  const empty = artistIds.length === 0

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="bottom"
        className="m-sheet mx-auto gap-0 data-[side=bottom]:border-t-0"
      >
        <SheetTitle className="sr-only">내 라인업</SheetTitle>
        <div className="m-sheet__handle" aria-hidden="true" />

        <h2 className="m-sheet__title">내 라인업</h2>
        {!empty && (
          <p className="m-sheet__meta">
            {dayLabel} · 대표곡 준비 {readyCount}/{artistIds.length}
          </p>
        )}

        {empty ? (
          <p className="m-muted m-sheet__empty">
            이 날 아직 담은 아티스트가 없어요. 타임테이블에서 ☆로 담아 보세요.
          </p>
        ) : (
          <ul className="m-chips">
            {artistIds.map((id) => {
              const artist = artists.get(id)
              if (!artist) return null
              return (
                <li key={id} className="m-chip">
                  <button type="button" className="m-chip__name" onClick={() => onArtistClick(id)}>
                    {artist.displayName}
                  </button>
                  <button
                    type="button"
                    className="m-chip__x"
                    aria-label={`${artist.displayName} 빼기`}
                    onClick={() => onRemove(id)}
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  )
}
