import { useEffect, useRef } from 'react'
import type { Artist, ArtistPlaylist, Festival, DayLineup } from '../types'
import ArtistPlaylistPanel from './ArtistPlaylistPanel'
import { officialArtistName } from '../lib/artistOfficialName'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

interface PlaylistMobileDockProps {
  open: boolean
  onOpen: () => void
  onClose: () => void
  onBackFromArtist: () => void
  onSwitchSheetHub: () => void
  onSwitchSheetLineup: () => void
  sheetReturnView: 'hub' | 'lineup'
  festival: Festival
  activeDay?: DayLineup
  selectedArtist: Artist | null
  artistPlaylist: ArtistPlaylist | null
  playlistLoading: boolean
  playlistReady: Set<string>
  bundleLoading: 'day' | 'festival' | 'custom' | null
  headlinerIds?: Set<string>
  onOpenBundled: (kind: 'day' | 'festival', artistIds: string[], title: string) => void
  onOpenMyPlaylist?: () => void
  myLineupCount?: number
  artists: import('../types').Artist[]
  showMyLineupEditor?: boolean
  myLineupIds?: string[]
  onToggleMyLineup?: (artistId: string) => void
  onClearMyLineup?: () => void
  onPlayMyLineup?: () => void
  onToggleMyLineupFromArtist?: (artistId: string) => void
  onSelectArtistFromLineup?: (artistId: string) => void
  onOpenMyLineupFromArtist?: () => void
  isInMyLineup?: (artistId: string) => boolean
  bundleNotice?: import('../lib/bundlePlaylist').BundledAnonymousPlaylist | null
  onDismissBundleNotice?: () => void
}

/** Fixed playlist FAB — opens the listen hub (day / festival / my). */
export default function PlaylistMobileDock({
  open,
  onOpen,
  onClose,
  onBackFromArtist,
  onSwitchSheetHub,
  onSwitchSheetLineup,
  sheetReturnView,
  showMyLineupEditor = false,
  myLineupCount = 0,
  ...panelProps
}: PlaylistMobileDockProps) {
  const selectedArtist = panelProps.selectedArtist
  const sheetView = selectedArtist ? 'artist' : showMyLineupEditor ? 'lineup' : 'hub'

  const sheetLabel = showMyLineupEditor
    ? '내 라인업'
    : selectedArtist
      ? `${officialArtistName(selectedArtist)} 대표곡`
      : '대표곡'

  const contentRef = useRef<HTMLDivElement>(null)
  const selectedArtistId = selectedArtist?.id

  const fabTitle = open
    ? '듣기 패널 닫기'
    : myLineupCount > 0
      ? `내 라인업 ${myLineupCount} · 대표곡 듣기`
      : '대표곡 듣기'

  const fabLabel = open ? '닫기' : myLineupCount > 0 ? `듣기 · ${myLineupCount}` : '듣기'

  const toggleSheet = () => (open ? onClose() : onOpen())

  // 시트 오픈·아티스트 전환 시 스크롤을 맨 위로 — 이전 위치 잔류로 인한 어색함 제거
  useEffect(() => {
    if (!open) return
    contentRef.current?.scrollTo({ top: 0 })
  }, [open, selectedArtistId, showMyLineupEditor])

  return (
    <div className="playlist-dock">
      <button
        type="button"
        className={`playlist-fab${open ? ' is-open' : ''}`}
        aria-label={fabTitle}
        aria-expanded={open}
        onClick={toggleSheet}
      >
        {open ? (
          <svg
            className="playlist-fab__glyph"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M7.5 14.5 12 10l4.5 4.5H7.5z"
            />
          </svg>
        ) : (
          <svg
            className="playlist-fab__glyph"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="2.5" y="5.5" width="11" height="2.2" rx="1.1" fill="currentColor" />
            <rect x="2.5" y="10.9" width="11" height="2.2" rx="1.1" fill="currentColor" />
            <rect x="2.5" y="16.3" width="8" height="2.2" rx="1.1" fill="currentColor" />
            <circle cx="17.2" cy="17" r="2.6" fill="currentColor" />
            <rect x="19" y="5" width="1.7" height="12.2" rx="0.6" fill="currentColor" />
            <path
              fill="currentColor"
              d="M20.7 5c.1 2.4 1.6 3.6 3.1 4v1.9c-2-.6-3.8-2.1-4.6-4.4V5h1.5z"
            />
          </svg>
        )}
        <span className="playlist-fab__label">{fabLabel}</span>
      </button>

      <Sheet open={open} onOpenChange={(next) => (next ? onOpen() : onClose())}>

        <SheetContent
          ref={contentRef}
          side="bottom"
          showCloseButton={false}
          className={`playlist-sheet mx-auto gap-0 overscroll-contain data-[side=bottom]:border-t-0 min-[900px]:hidden${showMyLineupEditor ? ' playlist-sheet--lineup' : ''}${selectedArtist ? ' playlist-sheet--artist' : ''}`}
        >
          <SheetTitle className="sr-only">{sheetLabel}</SheetTitle>
          <div className="playlist-sheet__handle" aria-hidden="true" />

          <header className="playlist-sheet__header">
            {sheetView === 'artist' ? (
              <div className="playlist-sheet__artist-bar">
                <div className="playlist-sheet__artist-nav">
                  <button
                    type="button"
                    className="playlist-sheet__back"
                    onClick={onBackFromArtist}
                  >
                    <span className="playlist-sheet__back-mark" aria-hidden="true">←</span>
                    {sheetReturnView === 'lineup' ? '내 라인업' : '대표곡'}
                  </button>
                  {panelProps.onOpenMyLineupFromArtist && sheetReturnView === 'hub' && (
                    <button
                      type="button"
                      className="playlist-sheet__lineup-link"
                      onClick={panelProps.onOpenMyLineupFromArtist}
                    >
                      내 라인업
                      {myLineupCount > 0 ? ` (${myLineupCount})` : ''}
                    </button>
                  )}
                </div>
                <div className="playlist-sheet__artist-title-row">
                  <h3 className="playlist-sheet__artist-title">
                    {officialArtistName(selectedArtist!)}
                  </h3>
                  {panelProps.onToggleMyLineupFromArtist && selectedArtist && (
                    <button
                      type="button"
                      className={`playlist-sheet__pick${panelProps.isInMyLineup?.(selectedArtist.id) ? ' is-on' : ''}`}
                      onClick={() => panelProps.onToggleMyLineupFromArtist?.(selectedArtist.id)}
                      aria-pressed={!!panelProps.isInMyLineup?.(selectedArtist.id)}
                      aria-label={
                        panelProps.isInMyLineup?.(selectedArtist.id)
                          ? '내 라인업에서 빼기'
                          : '내 라인업에 담기'
                      }
                    >
                      <span aria-hidden="true">
                        {panelProps.isInMyLineup?.(selectedArtist.id) ? '★' : '☆'}
                      </span>
                      {panelProps.isInMyLineup?.(selectedArtist.id) ? '담김' : '담기'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="playlist-sheet__hub-bar">
                <nav className="playlist-sheet__tabs" aria-label="대표곡 시트">
                  <button
                    type="button"
                    className={`playlist-sheet__tab${sheetView === 'hub' ? ' is-active' : ''}`}
                    aria-current={sheetView === 'hub' ? 'page' : undefined}
                    onClick={onSwitchSheetHub}
                  >
                    대표곡
                  </button>
                  <button
                    type="button"
                    className={`playlist-sheet__tab${sheetView === 'lineup' ? ' is-active' : ''}`}
                    aria-current={sheetView === 'lineup' ? 'page' : undefined}
                    onClick={onSwitchSheetLineup}
                  >
                    내 라인업
                    {myLineupCount > 0 ? ` (${myLineupCount})` : ''}
                  </button>
                </nav>
                <button
                  type="button"
                  className="playlist-sheet__close"
                  onClick={onClose}
                  aria-label="시트 닫기"
                >
                  닫기
                </button>
              </div>
            )}
          </header>

          <ArtistPlaylistPanel
            {...panelProps}
            showMyLineupEditor={showMyLineupEditor}
            hideArtistNavBar
            onCloseArtist={onBackFromArtist}
            artistCloseLabel={
              sheetReturnView === 'lineup' ? '내 라인업' : '대표곡'
            }
            artistCloseMode="back"
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
