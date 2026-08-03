import { useEffect, useState } from 'react'
import type { Artist, ArtistPlaylist } from '../../types'
import { FestivalService } from '../../services/festivals'
import { officialArtistName } from '../../lib/artistOfficialName'
import { buildWatchVideosUrl } from '../../lib/youtubePlaylist'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

interface FmArtistSheetProps {
  open: boolean
  artist: Artist | null
  festivalName: string
  inLineup: boolean
  onClose: () => void
  onToggleLineup: () => void
  onOpenPlanTab?: () => void
  lineupCount?: number
}

/** 아티스트 대표곡 — 패널·허브 없이 한 덩어리 */
export default function FmArtistSheet({
  open,
  artist,
  festivalName,
  inLineup,
  onClose,
  onToggleLineup,
  onOpenPlanTab,
  lineupCount = 0,
}: FmArtistSheetProps) {
  const [playlist, setPlaylist] = useState<ArtistPlaylist | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    if (!open || !artist) {
      setPlaylist(null)
      setLoading(false)
      return
    }

    setLoading(true)
    FestivalService.getPlaylistForArtist(artist.id).then((data) => {
      if (active) {
        setPlaylist(data || null)
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [open, artist?.id])

  if (!artist) return null

  const name = officialArtistName(artist)
  const tracks = playlist?.tracks ?? []
  const listenUrl =
    playlist?.youtubePlaylistUrl ||
    buildWatchVideosUrl(
      tracks.map((t) => t.videoId),
      playlist?.playlistTitle || `${festivalName} ${name} 대표곡`,
    )

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="fm2-sheet mx-auto gap-0 data-[side=bottom]:border-t-0"
      >
        <SheetTitle className="sr-only">{name} 대표곡</SheetTitle>
        <div className="fm2-sheet__handle" aria-hidden="true" />

        <div className="fm2-sheet__toolbar">
          <button type="button" className="fm2-sheet__ghost" onClick={onClose}>
            닫기
          </button>
          {onOpenPlanTab && lineupCount > 0 && (
            <button type="button" className="fm2-sheet__link" onClick={onOpenPlanTab}>
              라인업 {lineupCount}팀
            </button>
          )}
        </div>

        <div className="fm2-sheet__hero">
          <h2 className="fm2-sheet__name">{name}</h2>
          <button
            type="button"
            className={`fm2-sheet__star${inLineup ? ' is-on' : ''}`}
            onClick={onToggleLineup}
            aria-pressed={inLineup}
          >
            {inLineup ? '★ 담김' : '☆ 담기'}
          </button>
        </div>

        {loading && <p className="fm2-sheet__status">대표곡 불러오는 중…</p>}

        {!loading && tracks.length === 0 && (
          <p className="fm2-sheet__status">대표곡 준비 중이에요.</p>
        )}

        {!loading && tracks.length > 0 && (
          <div className="fm2-sheet__listen-block">
            <p className="fm2-sheet__meta">{tracks.length}곡 · YouTube</p>
            {listenUrl && (
              <a
                href={listenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="fm2-btn fm2-btn--primary fm2-btn--block"
              >
                YouTube로 듣기
              </a>
            )}
            <ol className="fm2-tracklist">
              {tracks.map((track, i) => (
                <li key={track.videoId} className="fm2-tracklist__item">
                  <span className="fm2-tracklist__num">{i + 1}</span>
                  <span className="fm2-tracklist__title">{track.songTitle || track.title}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
