import type { Festival, DayLineup } from '../types'
import {
  playlistTitleForDay,
  playlistTitleForFestival,
} from '../lib/youtubePlaylist'

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
      <p className="playlist-hub__label">플레이리스트 듣기</p>
      <div className="playlist-hub__actions">
        {dayReadyCount > 0 && activeDay && (
          <button
            type="button"
            className="btn-primary playlist-hub__btn"
            disabled={bundleLoading !== null}
            onClick={() => onOpenBundled('day', dayArtistIds, dayPlaylistTitle)}
          >
            {bundleLoading === 'day'
              ? '여는 중…'
              : `${activeDay.dayLabel} 대표곡`}
          </button>
        )}
        {festivalReadyCount > 0 && (
          <button
            type="button"
            className="btn-secondary playlist-hub__btn"
            disabled={bundleLoading !== null}
            onClick={() => onOpenBundled('festival', festival.allArtists || [], festivalPlaylistTitle)}
          >
            {bundleLoading === 'festival' ? '여는 중…' : '페스티벌 전체'}
          </button>
        )}
        {showMyPlaylist && (
          <button
            type="button"
            className="btn-secondary playlist-hub__btn playlist-hub__btn--mine"
            onClick={onOpenMyPlaylist}
            disabled={!onOpenMyPlaylist}
            title={onOpenMyPlaylist ? '내가 고른 플레이리스트' : '준비 중'}
          >
            {myLineupCount > 0 ? `나만의 (${myLineupCount})` : '나만의 플레이리스트'}
          </button>
        )}
      </div>
    </div>
  )
}
