import { useEffect, useRef } from 'react'
import type { Artist, ArtistPlaylist, Festival, DayLineup } from '../../types'
import ArtistPlaylistPanel from '../ArtistPlaylistPanel'
import { officialArtistName } from '../../lib/artistOfficialName'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

interface FestivalMobileArtistSheetProps {
  open: boolean
  onClose: () => void
  onOpenPlanTab?: () => void
  myLineupCount?: number
  festival: Festival
  activeDay?: DayLineup
  artists: Artist[]
  artist: Artist | null
  artistPlaylist: ArtistPlaylist | null
  playlistLoading: boolean
  playlistReady: Set<string>
  bundleLoading: 'day' | 'festival' | 'custom' | null
  headlinerIds?: Set<string>
  onToggleLineup?: (artistId: string) => void
  isInLineup?: (artistId: string) => boolean
}

/** 타임테이블에서 탭한 아티스트 대표곡 */
export default function FestivalMobileArtistSheet({
  open,
  onClose,
  onOpenPlanTab,
  myLineupCount = 0,
  festival,
  activeDay,
  artists,
  artist,
  artistPlaylist,
  playlistLoading,
  playlistReady,
  bundleLoading,
  headlinerIds,
  onToggleLineup,
  isInLineup,
}: FestivalMobileArtistSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    scrollRef.current?.scrollTo({ top: 0 })
  }, [open, artist?.id])

  const label = artist ? `${officialArtistName(artist)} 대표곡` : '아티스트 대표곡'

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        ref={scrollRef}
        side="bottom"
        showCloseButton={false}
        className="fm-sheet mx-auto gap-0 data-[side=bottom]:border-t-0"
      >
        <SheetTitle className="sr-only">{label}</SheetTitle>
        <div className="fm-sheet__handle" aria-hidden="true" />

        {artist && (
          <>
            <div className="fm-sheet__top">
              <button type="button" className="fm-sheet__close" onClick={onClose}>
                닫기
              </button>
              {onOpenPlanTab && myLineupCount > 0 && (
                <button type="button" className="fm-sheet__plan-link" onClick={onOpenPlanTab}>
                  내 라인업 ({myLineupCount})
                </button>
              )}
            </div>

            <div className="fm-sheet__title-row">
              <h2 className="fm-sheet__title">{officialArtistName(artist)}</h2>
              {onToggleLineup && (
                <button
                  type="button"
                  className={`fm-sheet__pick${isInLineup?.(artist.id) ? ' is-on' : ''}`}
                  onClick={() => onToggleLineup(artist.id)}
                  aria-pressed={!!isInLineup?.(artist.id)}
                  aria-label={
                    isInLineup?.(artist.id) ? '내 라인업에서 빼기' : '내 라인업에 담기'
                  }
                >
                  <span aria-hidden="true">{isInLineup?.(artist.id) ? '★' : '☆'}</span>
                  {isInLineup?.(artist.id) ? '담김' : '담기'}
                </button>
              )}
            </div>

            <ArtistPlaylistPanel
              festival={festival}
              activeDay={activeDay}
              artists={artists}
              selectedArtist={artist}
              artistPlaylist={artistPlaylist}
              playlistLoading={playlistLoading}
              playlistReady={playlistReady}
              bundleLoading={bundleLoading}
              headlinerIds={headlinerIds}
              onOpenBundled={() => {}}
              hideHub
              hideArtistNavBar
              onCloseArtist={onClose}
              artistCloseLabel="닫기"
              artistCloseMode="close"
              onToggleMyLineupFromArtist={onToggleLineup}
              isInMyLineup={isInLineup}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
