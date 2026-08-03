import type { MobileArtistView } from '../view/types'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

interface MobileLineupSheetProps {
  open: boolean
  artistIds: string[]
  artists: Map<string, MobileArtistView>
  playlistReady: Set<string>
  loading: boolean
  onClose: () => void
  onPlay: () => void
  onClear: () => void
  onRemove: (artistId: string) => void
  onArtistClick: (artistId: string) => void
}

export default function MobileLineupSheet({
  open,
  artistIds,
  artists,
  playlistReady,
  loading,
  onClose,
  onPlay,
  onClear,
  onRemove,
  onArtistClick,
}: MobileLineupSheetProps) {
  const readyCount = artistIds.filter((id) => playlistReady.has(id)).length
  const canPlay = readyCount > 0 && !loading

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="m-sheet mx-auto gap-0 data-[side=bottom]:border-t-0"
      >
        <SheetTitle className="sr-only">내 라인업</SheetTitle>
        <div className="m-sheet__handle" aria-hidden="true" />

        <div className="m-sheet__toolbar">
          <button type="button" className="m-sheet__ghost" onClick={onClose}>
            닫기
          </button>
          {artistIds.length > 0 && (
            <button type="button" className="m-sheet__link" onClick={onClear}>
              비우기
            </button>
          )}
        </div>

        <h2 className="m-sheet__title">내 라인업</h2>
        <p className="m-sheet__meta">
          {artistIds.length}팀 · 대표곡 준비 {readyCount}/{artistIds.length}
        </p>

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

        <button
          type="button"
          className="m-btn m-btn--block m-btn--outline"
          disabled={!canPlay}
          onClick={onPlay}
        >
          {loading ? '여는 중…' : '내 라인업 YouTube로'}
        </button>
      </SheetContent>
    </Sheet>
  )
}
