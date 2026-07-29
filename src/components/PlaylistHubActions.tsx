import type { Festival, DayLineup } from '../types'
import {
  playlistTitleForDay,
  playlistTitleForFestival,
} from '../lib/youtubePlaylist'
import { Button } from '@/components/ui/button'

interface PlaylistHubActionsProps {
  festival: Festival
  activeDay?: DayLineup
  playlistReady: Set<string>
  bundleLoading: 'day' | 'festival' | 'custom' | null
  onOpenBundled: (kind: 'day' | 'festival', artistIds: string[], title: string) => void
  /** Compact row under day tabs (mobile-first) */
  variant?: 'bar' | 'stack'
  showMyPlaylist?: boolean
  onOpenMyPlaylist?: () => void
  myLineupCount?: number
}

export default function PlaylistHubActions({
  festival,
  activeDay,
  playlistReady,
  bundleLoading,
  onOpenBundled,
  variant = 'stack',
  showMyPlaylist = true,
  onOpenMyPlaylist,
  myLineupCount = 0,
}: PlaylistHubActionsProps) {
  const dayPlaylistTitle = playlistTitleForDay(festival.name, activeDay?.dayLabel || '')
  const festivalPlaylistTitle = playlistTitleForFestival(festival.name)
  const dayArtistIds = activeDay?.artists?.length
    ? activeDay.artists
    : (activeDay?.slots || []).map((s) => s.artistId)
  const dayReadyCount = dayArtistIds.filter((id) => playlistReady.has(id)).length
  const festivalReadyCount = (festival.allArtists || []).filter((id) => playlistReady.has(id)).length

  if (dayReadyCount === 0 && festivalReadyCount === 0 && !showMyPlaylist) {
    return null
  }

  return (
    <div className={`playlist-hub playlist-hub--${variant}`}>
      <p className="playlist-hub__label">대표곡 듣기</p>
      <div className="playlist-hub__actions">
        {dayReadyCount > 0 && activeDay && (
          <Button
            className="playlist-hub__btn"
            disabled={bundleLoading !== null}
            onClick={() => onOpenBundled('day', dayArtistIds, dayPlaylistTitle)}
          >
            {bundleLoading === 'day'
              ? '여는 중…'
              : `${activeDay.dayLabel} 대표곡`}
          </Button>
        )}
        {festivalReadyCount > 0 && (
          <Button
            variant="outline"
            className="playlist-hub__btn"
            disabled={bundleLoading !== null}
            onClick={() => onOpenBundled('festival', festival.allArtists || [], festivalPlaylistTitle)}
          >
            {bundleLoading === 'festival' ? '여는 중…' : '페스티벌 전체'}
          </Button>
        )}
        {showMyPlaylist && (
          <Button
            variant="outline"
            className="playlist-hub__btn playlist-hub__btn--mine"
            onClick={onOpenMyPlaylist}
            disabled={!onOpenMyPlaylist}
            title={onOpenMyPlaylist ? '내 라인업' : '준비 중'}
          >
            {myLineupCount > 0 ? `내 라인업 (${myLineupCount})` : '내 라인업'}
          </Button>
        )}
      </div>
    </div>
  )
}
