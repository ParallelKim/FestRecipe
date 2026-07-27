import type { Artist, ArtistPlaylist, Festival, DayLineup } from '../types'
import {
  buildWatchVideosUrl,
  playlistTitleForArtist,
  playlistTitleForDay,
  playlistTitleForFestival,
} from '../lib/youtubePlaylist'
import { officialArtistName } from '../lib/artistOfficialName'

interface ArtistPlaylistPanelProps {
  festival: Festival
  activeDay?: DayLineup
  selectedArtist: Artist | null
  artistPlaylist: ArtistPlaylist | null
  playlistLoading: boolean
  playlistReady: Set<string>
  bundleLoading: 'day' | 'festival' | null
  headlinerIds?: Set<string>
  onCloseArtist?: () => void
  onOpenBundled: (kind: 'day' | 'festival', artistIds: string[], title: string) => void
}

export default function ArtistPlaylistPanel({
  festival,
  activeDay,
  selectedArtist,
  artistPlaylist,
  playlistLoading,
  playlistReady,
  bundleLoading,
  headlinerIds,
  onCloseArtist,
  onOpenBundled,
}: ArtistPlaylistPanelProps) {
  const displayName = selectedArtist ? officialArtistName(selectedArtist) : ''
  const artistPlaylistTitle = selectedArtist
    ? playlistTitleForArtist(festival.name, displayName)
    : ''
  const artistPlaylistUrl = artistPlaylist
    ? buildWatchVideosUrl(
        artistPlaylist.tracks.map((t) => t.videoId),
        artistPlaylistTitle,
      )
    : null

  const dayPlaylistTitle = playlistTitleForDay(festival.name, activeDay?.dayLabel || '')
  const festivalPlaylistTitle = playlistTitleForFestival(festival.name)
  const dayArtistIds = activeDay?.artists?.length
    ? activeDay.artists
    : (activeDay?.slots || []).map((s) => s.artistId)
  const dayReadyCount = dayArtistIds.filter((id) => playlistReady.has(id)).length
  const festivalReadyCount = (festival.allArtists || []).filter((id) => playlistReady.has(id)).length
  const isHeadliner = !!(selectedArtist && headlinerIds?.has(selectedArtist.id))

  return (
    <div id="artist-playlist-panel" className="playlist-panel">
      {selectedArtist ? (
        <div>
          <div className="playlist-panel__header">
            <div>
              <div className="playlist-panel__title-row">
                <h3 className="playlist-panel__title">{displayName}</h3>
                {isHeadliner && <span className="headliner-badge">헤드라이너</span>}
              </div>
              <p className="playlist-panel__meta">
                {artistPlaylist
                  ? `대표곡 ${artistPlaylist.songCount}곡 · YouTube Music`
                  : 'YouTube Music 인기곡 기반 대표 플레이리스트'}
              </p>
            </div>
            {onCloseArtist && (
              <button type="button" className="playlist-panel__close" onClick={onCloseArtist} aria-label="닫기">
                닫기
              </button>
            )}
          </div>

          {playlistLoading ? (
            <div className="playlist-panel__empty">
              <span className="loading-spinner loading-spinner--sm" aria-hidden="true" />
              <p>플레이리스트 불러오는 중...</p>
            </div>
          ) : artistPlaylist && artistPlaylist.tracks.length > 0 ? (
            <div className="playlist-panel__body">
              {artistPlaylistUrl && (
                <a
                  href={artistPlaylistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary playlist-panel__play"
                >
                  대표곡 {artistPlaylist.songCount}곡 연속 재생
                </a>
              )}

              <p className="playlist-panel__list-label">대표곡</p>

              <div className="playlist-panel__tracks">
                {artistPlaylist.tracks.map((track, idx) => {
                  const startIds = [
                    ...artistPlaylist.tracks.slice(idx).map((t) => t.videoId),
                    ...artistPlaylist.tracks.slice(0, idx).map((t) => t.videoId),
                  ]
                  const fromHereUrl = buildWatchVideosUrl(startIds, artistPlaylistTitle) || '#'

                  return (
                    <div key={track.videoId} className="playlist-track">
                      <span className="playlist-track__num">{idx + 1}</span>
                      <div className="playlist-track__info">
                        <div className="playlist-track__title">{track.songTitle}</div>
                        {track.albumTitle && (
                          <div className="playlist-track__album">
                            {track.albumTitle}{track.year ? ` · ${track.year}` : ''}
                          </div>
                        )}
                      </div>
                      <div className="playlist-track__actions">
                        <a
                          href={track.youtubeMusicUrl || track.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="playlist-track__btn"
                        >
                          곡
                        </a>
                        <a
                          href={fromHereUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="playlist-track__btn playlist-track__btn--primary"
                        >
                          여기부터
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="playlist-panel__empty">
              <h4>플레이리스트 준비 중</h4>
              <p>{displayName}의 YouTube Music 대표곡을 모으고 있습니다.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="playlist-panel__idle">
          <h4>아티스트를 선택하세요</h4>
          <p>
            {festival.lineupStage === 'stage3_timetable'
              ? '타임테이블의 무대 카드를 누르면'
              : '라인업에서 아티스트를 누르면'}
            <br />
            대표곡 플레이리스트가 열립니다.
          </p>

          {(dayReadyCount > 0 || festivalReadyCount > 0) && (
            <div className="playlist-panel__bundles">
              {dayReadyCount > 0 && activeDay && (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={bundleLoading !== null}
                  onClick={() => onOpenBundled('day', dayArtistIds, dayPlaylistTitle)}
                >
                  {bundleLoading === 'day' ? '여는 중…' : `${activeDay.dayLabel} 대표곡 듣기`}
                </button>
              )}
              {festivalReadyCount > 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={bundleLoading !== null}
                  onClick={() => onOpenBundled('festival', festival.allArtists || [], festivalPlaylistTitle)}
                >
                  {bundleLoading === 'festival' ? '여는 중…' : '페스티벌 전체 대표곡 듣기'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
