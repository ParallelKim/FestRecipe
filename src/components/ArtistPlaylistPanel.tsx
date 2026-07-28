import type { Artist, ArtistPlaylist, Festival, DayLineup } from '../types'
import {
  buildWatchVideosUrl,
  playlistTitleForArtist,
} from '../lib/youtubePlaylist'
import { officialArtistName } from '../lib/artistOfficialName'
import {
  bundleNoticeCopy,
  type BundledAnonymousPlaylist,
} from '../lib/bundlePlaylist'
import PlaylistHubActions from './PlaylistHubActions'
import MyLineupPanel from './MyLineupPanel'

interface ArtistPlaylistPanelProps {
  festival: Festival
  activeDay?: DayLineup
  artists: Artist[]
  selectedArtist: Artist | null
  artistPlaylist: ArtistPlaylist | null
  playlistLoading: boolean
  playlistReady: Set<string>
  bundleLoading: 'day' | 'festival' | 'custom' | null
  headlinerIds?: Set<string>
  onCloseArtist?: () => void
  onOpenBundled: (kind: 'day' | 'festival', artistIds: string[], title: string) => void
  onOpenMyPlaylist?: () => void
  myLineupCount?: number
  /** Hide duplicate hub when parent already renders PlaylistHubActions */
  hideHub?: boolean
  showMyLineupEditor?: boolean
  myLineupIds?: string[]
  onToggleMyLineup?: (artistId: string) => void
  onClearMyLineup?: () => void
  onPlayMyLineup?: () => void
  onToggleMyLineupFromArtist?: (artistId: string) => void
  isInMyLineup?: (artistId: string) => boolean
  /** 요일/전체·나만의 번들 시 다운그레이드·잘림 안내 */
  bundleNotice?: BundledAnonymousPlaylist | null
  onDismissBundleNotice?: () => void
}

export default function ArtistPlaylistPanel({
  festival,
  activeDay,
  artists,
  selectedArtist,
  artistPlaylist,
  playlistLoading,
  playlistReady,
  bundleLoading,
  headlinerIds,
  onCloseArtist,
  onOpenBundled,
  onOpenMyPlaylist,
  myLineupCount = 0,
  hideHub = false,
  showMyLineupEditor = false,
  myLineupIds = [],
  onToggleMyLineup,
  onClearMyLineup,
  onPlayMyLineup,
  onToggleMyLineupFromArtist,
  isInMyLineup,
  bundleNotice = null,
  onDismissBundleNotice,
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
  const notice = bundleNotice && !showMyLineupEditor ? bundleNoticeCopy(bundleNotice) : null
  const inMyLineup = !!(selectedArtist && isInMyLineup?.(selectedArtist.id))

  return (
    <div id="artist-playlist-panel" className={`playlist-panel${selectedArtist ? ' playlist-panel--artist' : ''}`}>
      {!hideHub && !selectedArtist && (
        <PlaylistHubActions
          festival={festival}
          activeDay={activeDay}
          playlistReady={playlistReady}
          bundleLoading={bundleLoading}
          onOpenBundled={onOpenBundled}
          onOpenMyPlaylist={onOpenMyPlaylist}
          myLineupCount={myLineupCount}
          variant="stack"
        />
      )}

      {notice && (
        <div
          className={`playlist-bundle-notice${bundleNotice?.truncated || bundleNotice?.thinCoverage ? ' is-warn' : ''}`}
          role="status"
        >
          <h4 className="playlist-bundle-notice__title">{notice.title}</h4>
          <p className="playlist-bundle-notice__body">{notice.body}</p>
          {onDismissBundleNotice && (
            <button
              type="button"
              className="btn-secondary playlist-bundle-notice__dismiss"
              onClick={onDismissBundleNotice}
            >
              확인
            </button>
          )}
        </div>
      )}

      {selectedArtist ? (
        <div className="playlist-panel__artist-view">
          <div className="playlist-artist-card" role="region" aria-label={`${displayName} 플레이리스트`}>
            <div className="playlist-artist-card__bar">
              <span className="playlist-artist-card__eyebrow">지금 선택</span>
              {onCloseArtist && (
                <button
                  type="button"
                  className="playlist-artist-card__close"
                  onClick={onCloseArtist}
                  aria-label="아티스트 닫기"
                >
                  닫기
                </button>
              )}
            </div>
            <div className="playlist-artist-card__head">
              <h3 className="playlist-artist-card__name">{displayName}</h3>
              {isHeadliner && <span className="headliner-badge">헤드라이너</span>}
            </div>
            <p className="playlist-artist-card__meta">
              {artistPlaylist
                ? `대표곡 ${artistPlaylist.songCount}곡 · YouTube`
                : 'YouTube 인기곡 기반 대표 플레이리스트'}
            </p>

            <div className="playlist-artist-card__actions">
              {playlistLoading ? (
                <div className="playlist-artist-card__loading" aria-live="polite">
                  <span className="loading-spinner loading-spinner--sm" aria-hidden="true" />
                  불러오는 중…
                </div>
              ) : artistPlaylist && artistPlaylist.tracks.length > 0 && artistPlaylistUrl ? (
                <a
                  href={artistPlaylistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary playlist-artist-card__play"
                >
                  대표곡 {artistPlaylist.songCount}곡 YouTube에서 연속 재생
                </a>
              ) : (
                <p className="playlist-artist-card__pending">플레이리스트 준비 중입니다.</p>
              )}
              {onToggleMyLineupFromArtist && (
                <button
                  type="button"
                  className={`playlist-artist-card__lineup${inMyLineup ? ' is-on' : ''}`}
                  onClick={() => onToggleMyLineupFromArtist(selectedArtist.id)}
                  aria-pressed={inMyLineup}
                >
                  <span className="playlist-artist-card__lineup-icon" aria-hidden="true">
                    {inMyLineup ? '★' : '☆'}
                  </span>
                  {inMyLineup ? '내 라인업 담김' : '내 라인업에 담기'}
                </button>
              )}
            </div>
          </div>

          {!playlistLoading && artistPlaylist && artistPlaylist.tracks.length > 0 ? (
            <div className="playlist-panel__body">
              <p className="playlist-panel__list-label">대표곡 목록</p>
              <div className="playlist-panel__tracks">
                {artistPlaylist.tracks.map((track, idx) => (
                  <div key={track.videoId} className="playlist-track">
                    <span className="playlist-track__num">{idx + 1}</span>
                    <div className="playlist-track__info">
                      <div className="playlist-track__title">{track.songTitle}</div>
                      {track.albumTitle && (
                        <div className="playlist-track__album">
                          {track.albumTitle}
                          {track.year ? ` · ${track.year}` : ''}
                        </div>
                      )}
                    </div>
                    <div className="playlist-track__actions">
                      <a
                        href={track.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="playlist-track__btn playlist-track__btn--primary"
                      >
                        YouTube
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !playlistLoading && (!artistPlaylist || artistPlaylist.tracks.length === 0) ? (
            <div className="playlist-panel__empty playlist-panel__empty--compact">
              <p>{displayName}의 YouTube 대표곡을 모으고 있습니다.</p>
            </div>
          ) : null}
        </div>
      ) : showMyLineupEditor && onToggleMyLineup && onClearMyLineup && onPlayMyLineup ? (
        <MyLineupPanel
          festival={festival}
          activeDay={activeDay}
          artists={artists}
          myLineupIds={myLineupIds}
          playlistReady={playlistReady}
          bundleLoading={bundleLoading === 'custom'}
          bundleNotice={bundleNotice}
          onToggleArtist={onToggleMyLineup}
          onClear={onClearMyLineup}
          onPlayYouTube={onPlayMyLineup}
          onDismissBundleNotice={onDismissBundleNotice}
        />
      ) : !notice ? (
        <div className="playlist-panel__idle">
          <h4>아티스트 플레이리스트</h4>
          <p>
            {festival.lineupStage === 'stage3_timetable'
              ? '타임테이블 카드를 누르면 해당 아티스트 대표곡이 열립니다.'
              : '라인업에서 아티스트를 누르면 대표곡이 열립니다.'}
          </p>
          <p className="playlist-panel__idle-hint">
            요일·페스티벌 전체 듣기는 위 버튼에서 바로 시작할 수 있습니다.
            나만의 플레이리스트는 타임테이블 ☆로 담은 뒤 YouTube로 듣거나 배경화면으로 저장할 수 있습니다.
          </p>
        </div>
      ) : null}
    </div>
  )
}
