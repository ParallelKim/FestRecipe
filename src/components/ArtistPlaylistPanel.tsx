import type { Artist, ArtistPlaylist, Festival, DayLineup } from '../types'
import {
  buildWatchVideosUrl,
  playlistTitleForArtist,
} from '../lib/youtubePlaylist'
import { officialArtistName } from '../lib/artistOfficialName'
import PlaylistHubActions from './PlaylistHubActions'

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
  onOpenMyPlaylist?: () => void
  /** Hide duplicate hub when parent already renders PlaylistHubActions */
  hideHub?: boolean
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
  onOpenMyPlaylist,
  hideHub = false,
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

  const isHeadliner = !!(selectedArtist && headlinerIds?.has(selectedArtist.id))

  return (
    <div id="artist-playlist-panel" className="playlist-panel">
      {!hideHub && (
        <PlaylistHubActions
          festival={festival}
          activeDay={activeDay}
          playlistReady={playlistReady}
          bundleLoading={bundleLoading}
          onOpenBundled={onOpenBundled}
          onOpenMyPlaylist={onOpenMyPlaylist}
          variant="stack"
        />
      )}

      {selectedArtist ? (
        <div className="playlist-panel__artist">
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
          <h4>아티스트 플레이리스트</h4>
          <p>
            {festival.lineupStage === 'stage3_timetable'
              ? '타임테이블 카드를 누르면 해당 아티스트 대표곡이 열립니다.'
              : '라인업에서 아티스트를 누르면 대표곡이 열립니다.'}
          </p>
          <p className="playlist-panel__idle-hint">
            요일·페스티벌 전체 듣기는 위 버튼에서 바로 시작할 수 있습니다.
            나만의 플레이리스트는 아티스트를 모아 듣는 기능으로 곧 연결됩니다.
          </p>
        </div>
      )}
    </div>
  )
}
