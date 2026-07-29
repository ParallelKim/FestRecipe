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
import { Button } from '@/components/ui/button'

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
  onSelectArtistFromLineup?: (artistId: string) => void
  onOpenMyLineupFromArtist?: () => void
  isInMyLineup?: (artistId: string) => boolean
  /** 요일/전체·나만의 번들 시 다운그레이드·잘림 안내 */
  bundleNotice?: BundledAnonymousPlaylist | null
  onDismissBundleNotice?: () => void
  hideArtistNavBar?: boolean
  artistCloseLabel?: string
  artistCloseMode?: 'close' | 'back'
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
  onSelectArtistFromLineup,
  onOpenMyLineupFromArtist,
  isInMyLineup,
  bundleNotice = null,
  onDismissBundleNotice,
  hideArtistNavBar = false,
  artistCloseLabel = '닫기',
  artistCloseMode = 'close',
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
            <Button
              variant="outline"
              className="playlist-bundle-notice__dismiss"
              onClick={onDismissBundleNotice}
            >
              확인
            </Button>
          )}
        </div>
      )}

      {selectedArtist ? (
        <div className="playlist-panel__artist-view">
          <div className="playlist-artist-card" role="region" aria-label={`${displayName} 대표곡`}>
            {onCloseArtist && !hideArtistNavBar && (
              <div className="playlist-artist-card__bar playlist-artist-card__bar--actions">
                <button
                  type="button"
                  className={`playlist-artist-card__close${artistCloseMode === 'back' ? ' playlist-artist-card__close--back' : ''}`}
                  onClick={onCloseArtist}
                  aria-label={
                    artistCloseMode === 'back'
                      ? `${artistCloseLabel}으로 돌아가기`
                      : '아티스트 닫기'
                  }
                >
                  {artistCloseMode === 'back' ? (
                    <>
                      <span aria-hidden="true">← </span>
                      {artistCloseLabel}
                    </>
                  ) : (
                    artistCloseLabel
                  )}
                </button>
              </div>
            )}
            {!hideArtistNavBar && (
              <div className="playlist-artist-card__head">
                <h3 className="playlist-artist-card__name">{displayName}</h3>
                {isHeadliner && <span className="headliner-badge">헤드라이너</span>}
              </div>
            )}
            <p className="playlist-artist-card__meta">
              {hideArtistNavBar && isHeadliner && (
                <span className="headliner-badge playlist-artist-card__meta-badge">헤드라이너</span>
              )}
              {artistPlaylist
                ? `대표곡 ${artistPlaylist.songCount}곡 · YouTube`
                : 'YouTube 인기곡 기준 대표곡'}
            </p>

            <div className="playlist-artist-card__actions">
              {playlistLoading ? (
                <div className="playlist-artist-card__loading" aria-live="polite">
                  <span className="loading-spinner loading-spinner--sm" aria-hidden="true" />
                  불러오는 중…
                </div>
              ) : artistPlaylist && artistPlaylist.tracks.length > 0 && artistPlaylistUrl ? (
                <Button
                  render={
                    <a
                      href={artistPlaylistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  nativeButton={false}
                  className="playlist-artist-card__play"
                >
                  대표곡 {artistPlaylist.songCount}곡 YouTube로 듣기
                </Button>
              ) : (
                <p className="playlist-artist-card__pending">대표곡을 준비 중이에요.</p>
              )}
              {onToggleMyLineupFromArtist && (
                inMyLineup && onOpenMyLineupFromArtist ? (
                  <div className="playlist-artist-card__lineup-row">
                    <button
                      type="button"
                      className="playlist-artist-card__lineup is-on"
                      onClick={() => onToggleMyLineupFromArtist(selectedArtist.id)}
                      aria-pressed={true}
                      aria-label="내 라인업에서 빼기"
                    >
                      <span className="playlist-artist-card__lineup-icon" aria-hidden="true">
                        ★
                      </span>
                      담김
                    </button>
                    <button
                      type="button"
                      className="playlist-artist-card__lineup-go"
                      onClick={onOpenMyLineupFromArtist}
                    >
                      내 라인업
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`playlist-artist-card__lineup${inMyLineup ? ' is-on' : ''}`}
                    onClick={() => onToggleMyLineupFromArtist(selectedArtist.id)}
                    aria-pressed={inMyLineup}
                  >
                    <span className="playlist-artist-card__lineup-icon" aria-hidden="true">
                      {inMyLineup ? '★' : '☆'}
                    </span>
                    {inMyLineup ? '담김' : '담기'}
                  </button>
                )
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
              <p>{displayName}의 대표곡을 모으고 있어요.</p>
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
          onSelectArtist={onSelectArtistFromLineup}
          onClear={onClearMyLineup}
          onPlayYouTube={onPlayMyLineup}
          onDismissBundleNotice={onDismissBundleNotice}
        />
      ) : !notice ? (
        <div className="playlist-panel__idle">
          <h4>아티스트 대표곡</h4>
          <p>
            {festival.lineupStage === 'stage3_timetable'
              ? '타임테이블에서 아티스트를 누르면 대표곡이 열려요.'
              : '라인업에서 아티스트를 누르면 대표곡이 열려요.'}
          </p>
          <p className="playlist-panel__idle-hint">
            날짜별·페스티벌 전체 듣기는 위 버튼에서 바로 시작할 수 있어요.
            ☆로 담은 아티스트는 내 라인업에서 모아 듣거나 배경화면으로 저장할 수 있어요.
          </p>
        </div>
      ) : null}
    </div>
  )
}
