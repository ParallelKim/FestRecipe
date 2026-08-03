import { XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import type { MobileArtistView } from '../view/types'

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
        showCloseButton={false}
        className="mx-auto w-full max-w-[560px] max-h-[min(82vh,720px)] gap-0 overflow-auto overscroll-contain rounded-t-[18px] border-t-0 px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]"
      >
        <SheetTitle className="sr-only">내 라인업</SheetTitle>
        <div
          className="mx-auto mb-3 mt-1 h-1 w-10 rounded-full bg-border"
          aria-hidden="true"
        />

        <h2 className="text-xl font-extrabold leading-snug">내 라인업</h2>
        {!empty && (
          <p className="mb-3 mt-0 text-xs leading-relaxed text-muted-foreground">
            {dayLabel} · 대표곡 준비 {readyCount}/{artistIds.length}
          </p>
        )}

        {empty ? (
          <p className="mb-2 text-[13px] leading-relaxed text-muted-foreground">
            이 날 아직 담은 아티스트가 없어요. 타임테이블에서 ☆로 담아 보세요.
          </p>
        ) : (
          <ul className="mb-3 flex flex-wrap gap-2 p-0 list-none m-0">
            {artistIds.map((id) => {
              const artist = artists.get(id)
              if (!artist) return null
              return (
                <li key={id}>
                  <Badge
                    variant="secondary"
                    className="h-auto gap-1 py-1 pl-2.5 pr-1 text-[13px] font-semibold"
                  >
                    <button
                      type="button"
                      className="cursor-pointer border-0 bg-transparent py-1"
                      onClick={() => onArtistClick(id)}
                    >
                      {artist.displayName}
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="size-7 rounded-full text-muted-foreground"
                      aria-label={`${artist.displayName} 빼기`}
                      onClick={() => onRemove(id)}
                    >
                      <XIcon />
                    </Button>
                  </Badge>
                </li>
              )
            })}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  )
}
