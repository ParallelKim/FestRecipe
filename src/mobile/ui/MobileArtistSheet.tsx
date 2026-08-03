import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import type { MobileArtistView, MobilePlaylistView } from '../view/types'
import { MobileLineupButton } from './MobileLineupButton'

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
        showCloseButton={false}
        className="mx-auto w-full max-w-[560px] max-h-[min(82vh,720px)] gap-0 overflow-auto overscroll-contain rounded-t-[18px] border-t-0 px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]"
      >
        <SheetTitle className="sr-only">{artist.displayName} 대표곡</SheetTitle>
        <div
          className="mx-auto mb-3 mt-1 h-1 w-10 rounded-full bg-border"
          aria-hidden="true"
        />

        <h2 className="mb-4 text-xl font-extrabold leading-snug">{artist.displayName}</h2>

        {loading && (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            대표곡 불러오는 중…
          </p>
        )}
        {!loading && tracks.length === 0 && (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            대표곡 준비 중이에요.
          </p>
        )}

        {!loading && tracks.length > 0 && (
          <div>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              {tracks.length}곡 · YouTube
            </p>
            <ButtonGroup className="mb-4 w-full">
              {listenUrl ? (
                <Button
                  render={<a href={listenUrl} target="_blank" rel="noopener noreferrer" />}
                  nativeButton={false}
                  className="h-11 min-w-0 flex-1"
                >
                  YouTube로 듣기
                </Button>
              ) : (
                <Button disabled className="h-11 min-w-0 flex-1">YouTube로 듣기</Button>
              )}
              <MobileLineupButton
                inLineup={inLineup}
                onToggle={onToggleLineup}
                className="h-11"
              />
            </ButtonGroup>
            <ol className="m-0 list-none border-t border-border p-0 pt-1">
              {tracks.map((track, i) => (
                <li
                  key={track.videoId}
                  className="flex items-baseline gap-2.5 border-b border-border py-2 text-sm leading-snug last:border-b-0"
                >
                  <span className="w-5 shrink-0 text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="flex-1">{track.title}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!loading && tracks.length === 0 && (
          <MobileLineupButton inLineup={inLineup} onToggle={onToggleLineup} />
        )}
      </SheetContent>
    </Sheet>
  )
}
