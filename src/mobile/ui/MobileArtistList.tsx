import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MobileArtistView } from '../view/types'
import { MobileLineupButton } from './MobileLineupButton'

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
    <ul className="m-0 flex flex-col gap-2 p-0 list-none">
      {artistIds.map((id) => {
        const artist = artists.get(id)
        if (!artist) return null
        const ready = playlistReady.has(id)
        const inLineup = lineupIds.includes(id)
        return (
          <li key={id} className="flex items-stretch gap-2">
            <Button
              type="button"
              variant="outline"
              className={cn(
                'h-11 min-h-11 flex-1 justify-between gap-2 px-3.5 text-left',
                selectedArtistId === id &&
                  'border-primary outline outline-2 outline-primary outline-offset-[-2px]',
              )}
              onClick={() => onArtistClick(id)}
            >
              <span className="text-sm font-bold">{artist.displayName}</span>
              <Badge
                variant={ready ? 'secondary' : 'outline'}
                className="shrink-0 text-[11px]"
              >
                {ready ? '대표곡 준비' : '준비 중'}
              </Badge>
            </Button>
            <MobileLineupButton
              compact
              inLineup={inLineup}
              onToggle={() => onToggleLineup(id)}
            />
          </li>
        )
      })}
    </ul>
  )
}
