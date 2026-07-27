import type { Artist, DayLineup, Festival } from '../types'
import { officialArtistName } from '../lib/artistOfficialName'
import type { BundledAnonymousPlaylist } from '../lib/bundlePlaylist'
import { bundleNoticeCopy } from '../lib/bundlePlaylist'
import TimetableWallpaperExport from './TimetableWallpaperExport'

interface MyLineupPanelProps {
  festival: Festival
  activeDay?: DayLineup
  artists: Artist[]
  lineup: DayLineup[]
  myLineupIds: string[]
  playlistReady: Set<string>
  bundleLoading: boolean
  bundleNotice: BundledAnonymousPlaylist | null
  onToggleArtist: (artistId: string) => void
  onClear: () => void
  onPlayYouTube: () => void
  onDismissBundleNotice?: () => void
}

function artistsForDay(day: DayLineup, artistMap: Map<string, Artist>): Artist[] {
  const ids = new Set<string>()
  if (day.artists?.length) {
    day.artists.forEach((id) => ids.add(id))
  }
  if (day.slots?.length) {
    day.slots.forEach((s) => ids.add(s.artistId))
  }
  return [...ids]
    .map((id) => artistMap.get(id))
    .filter((a): a is Artist => !!a)
}

export default function MyLineupPanel({
  festival,
  activeDay,
  artists,
  lineup,
  myLineupIds,
  playlistReady,
  bundleLoading,
  bundleNotice,
  onToggleArtist,
  onClear,
  onPlayYouTube,
  onDismissBundleNotice,
}: MyLineupPanelProps) {
  const artistMap = new Map(artists.map((a) => [a.id, a]))
  const selected = myLineupIds
    .map((id) => artistMap.get(id))
    .filter((a): a is Artist => !!a)
  const readyCount = myLineupIds.filter((id) => playlistReady.has(id)).length
  const notice = bundleNotice ? bundleNoticeCopy(bundleNotice) : null

  const daySections =
    lineup.length > 0
      ? lineup
          .map((day) => ({
            day,
            artists: artistsForDay(day, artistMap),
          }))
          .filter((s) => s.artists.length > 0)
      : [
          {
            day: { dayLabel: '라인업', artists: festival.allArtists } as DayLineup,
            artists: festival.allArtists
              .map((id) => artistMap.get(id))
              .filter((a): a is Artist => !!a),
          },
        ]

  return (
    <div className="my-lineup-panel">
      <div className="my-lineup-panel__head">
        <div>
          <h4 className="my-lineup-panel__title">나만의 플레이리스트</h4>
          <p className="my-lineup-panel__lede">
            볼 아티스트를 담고, YouTube로 듣거나 배경화면 타임테이블로 저장하세요.
          </p>
        </div>
        {myLineupIds.length > 0 && (
          <button type="button" className="my-lineup-panel__clear" onClick={onClear}>
            전체 비우기
          </button>
        )}
      </div>

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

      <div className="my-lineup-panel__picked">
        <p className="my-lineup-panel__picked-label">
          담은 아티스트 <strong>{myLineupIds.length}</strong>
          {readyCount < myLineupIds.length && (
            <span className="my-lineup-panel__picked-muted">
              {' '}
              · 플레이리스트 준비 {readyCount}팀
            </span>
          )}
        </p>
        {selected.length === 0 ? (
          <p className="my-lineup-panel__empty">아래에서 아티스트를 선택해 주세요.</p>
        ) : (
          <ul className="my-lineup-panel__chips">
            {selected.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="my-lineup-chip is-on"
                  onClick={() => onToggleArtist(a.id)}
                >
                  {officialArtistName(a)}
                  <span className="my-lineup-chip__x" aria-hidden="true">
                    ×
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="my-lineup-panel__actions">
        <button
          type="button"
          className="btn-primary my-lineup-panel__btn"
          disabled={readyCount === 0 || bundleLoading}
          onClick={onPlayYouTube}
        >
          {bundleLoading ? '여는 중…' : 'YouTube에서 듣기'}
        </button>
      </div>

      <TimetableWallpaperExport
        festival={festival}
        activeDay={activeDay}
        artists={artists}
        myLineupIds={myLineupIds}
      />

      <div className="my-lineup-panel__browse">
        <h5 className="my-lineup-panel__browse-title">아티스트 담기</h5>
        {daySections.map(({ day, artists: dayArtists }) => (
          <section key={day.dayLabel} className="my-lineup-day">
            <h5 className="my-lineup-day__label">{day.dayLabel}</h5>
            <ul className="my-lineup-day__list">
              {dayArtists.map((artist) => {
                const on = myLineupIds.includes(artist.id)
                const ready = playlistReady.has(artist.id)
                return (
                  <li key={artist.id}>
                    <button
                      type="button"
                      className={`my-lineup-pick${on ? ' is-on' : ''}`}
                      onClick={() => onToggleArtist(artist.id)}
                      disabled={!ready && !on}
                      title={ready ? undefined : '플레이리스트 준비 중'}
                    >
                      <span className="my-lineup-pick__mark" aria-hidden="true">
                        {on ? '✓' : '+'}
                      </span>
                      <span className="my-lineup-pick__name">{officialArtistName(artist)}</span>
                      {!ready && <span className="my-lineup-pick__status">준비 중</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
