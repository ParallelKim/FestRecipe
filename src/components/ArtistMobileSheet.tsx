import { useEffect, useRef } from 'react'
import type { Artist, ArtistPlaylist, Festival, DayLineup } from '../types'
import ArtistPlaylistPanel from './ArtistPlaylistPanel'
import { officialArtistName } from '../lib/artistOfficialName'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

interface ArtistMobileSheetProps {
  open: boolean
  onClose: () => void
  onScrollToMyLineup?: () => void
  myLineupCount?: number
  festival: Festival
  activeDay?: DayLineup
  artists: import('../types').Artist[]
  selectedArtist: Artist | null
  artistPlaylist: ArtistPlaylist | null
  playlistLoading: boolean
  playlistReady: Set<string>
  bundleLoading: 'day' | 'festival' | 'custom' | null
  headlinerIds?: Set<string>
  onToggleMyLineupFromArtist?: (artistId: string) => void
  isInMyLineup?: (artistId: string) => boolean
}

/** 타임테이블·라인업 칩 탭 → 아티스트 대표곡 (맥락 시트) */
export default function ArtistMobileSheet({
  open,
  onClose,
  onScrollToMyLineup,
  myLineupCount = 0,
  festival,
  activeDay,
  artists,
  selectedArtist,
  artistPlaylist,
  playlistLoading,
  playlistReady,
  bundleLoading,
  headlinerIds,
  onToggleMyLineupFromArtist,
  isInMyLineup,
}: ArtistMobileSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const selectedArtistId = selectedArtist?.id

  useEffect(() => {
    if (!open) return
    contentRef.current?.scrollTo({ top: 0 })
  }, [open, selectedArtistId])

  const sheetLabel = selectedArtist
    ? `${officialArtistName(selectedArtist)} 대표곡`
    : '아티스트 대표곡'

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        ref={contentRef}
        side="bottom"
        showCloseButton={false}
        className="playlist-sheet playlist-sheet--artist mx-auto gap-0 overscroll-contain data-[side=bottom]:border-t-0 min-[900px]:hidden"
      >
        <SheetTitle className="sr-only">{sheetLabel}</SheetTitle>
        <div className="playlist-sheet__handle" aria-hidden="true" />

        <header className="playlist-sheet__header">
          {selectedArtist && (
            <div className="playlist-sheet__artist-bar">
              <div className="playlist-sheet__artist-nav">
                <button
                  type="button"
                  className="playlist-sheet__back"
                  onClick={onClose}
                >
                  <span className="playlist-sheet__back-mark" aria-hidden="true">←</span>
                  닫기
                </button>
                {onScrollToMyLineup && myLineupCount > 0 && (
                  <button
                    type="button"
                    className="playlist-sheet__lineup-link"
                    onClick={onScrollToMyLineup}
                  >
                    내 라인업 ({myLineupCount})
                  </button>
                )}
              </div>
              <div className="playlist-sheet__artist-title-row">
                <h3 className="playlist-sheet__artist-title">
                  {officialArtistName(selectedArtist)}
                </h3>
                {onToggleMyLineupFromArtist && (
                  <button
                    type="button"
                    className={`playlist-sheet__pick${isInMyLineup?.(selectedArtist.id) ? ' is-on' : ''}`}
                    onClick={() => onToggleMyLineupFromArtist(selectedArtist.id)}
                    aria-pressed={!!isInMyLineup?.(selectedArtist.id)}
                    aria-label={
                      isInMyLineup?.(selectedArtist.id)
                        ? '내 라인업에서 빼기'
                        : '내 라인업에 담기'
                    }
                  >
                    <span aria-hidden="true">
                      {isInMyLineup?.(selectedArtist.id) ? '★' : '☆'}
                    </span>
                    {isInMyLineup?.(selectedArtist.id) ? '담김' : '담기'}
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {selectedArtist && (
          <ArtistPlaylistPanel
            festival={festival}
            activeDay={activeDay}
            artists={artists}
            selectedArtist={selectedArtist}
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
            onToggleMyLineupFromArtist={onToggleMyLineupFromArtist}
            isInMyLineup={isInMyLineup}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
