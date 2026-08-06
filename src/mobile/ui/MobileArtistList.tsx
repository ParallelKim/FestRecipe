import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MobileArtistView } from '../view/types'

interface MobileArtistListProps {
  artistIds: string[]
  artists: Map<string, MobileArtistView>
  lineupIds: string[]
  selectedArtistId?: string
  onArtistClick: (artistId: string) => void
  onToggleLineup: (artistId: string) => void
}

/**
 * stage2(일별) 등 타임테이블이 없을 때 — 이름 + ☆만 있는 칩 트리거.
 * 대표곡 준비 뱃지·풀폭 세로 행은 쓰지 않는다.
 */
export default function MobileArtistList({
  artistIds,
  artists,
  lineupIds,
  selectedArtistId,
  onArtistClick,
  onToggleLineup,
}: MobileArtistListProps) {
  return (
    <ul className="m-0 flex flex-wrap gap-2 p-0 list-none">
      {artistIds.map((id) => {
        const artist = artists.get(id)
        if (!artist) return null
        const inLineup = lineupIds.includes(id)
        const selected = selectedArtistId === id
        return (
          <li key={id} className="min-w-0">
            <div
              className={cn(
                'inline-flex h-9 max-w-full items-stretch overflow-hidden rounded-lg border border-border bg-background',
                selected && 'border-primary outline outline-2 outline-primary outline-offset-[-2px]',
                inLineup && !selected && 'border-primary/50 bg-primary/5',
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  'size-9 shrink-0 rounded-none text-base font-bold text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  inLineup && 'text-foreground',
                )}
                aria-pressed={inLineup}
                aria-label={
                  inLineup
                    ? `${artist.displayName} 내 라인업에서 빼기`
                    : `${artist.displayName} 내 라인업에 담기`
                }
                onClick={() => onToggleLineup(id)}
              >
                {inLineup ? '★' : '☆'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-9 min-h-9 min-w-0 flex-1 justify-start rounded-none px-2.5 text-left text-sm font-bold hover:bg-muted/60"
                onClick={() => onArtistClick(id)}
              >
                <span className="truncate">{artist.displayName}</span>
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
