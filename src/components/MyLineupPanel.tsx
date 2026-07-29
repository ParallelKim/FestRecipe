import { useMemo, useState } from 'react'
import type { Artist, DayLineup, Festival } from '../types'
import { officialArtistName } from '../lib/artistOfficialName'
import type { BundledAnonymousPlaylist } from '../lib/bundlePlaylist'
import { bundleNoticeCopy } from '../lib/bundlePlaylist'
import { filterMyLineupForDay } from '../lib/lineupDay'
import TimetableWallpaperStudio, { TimetableWallpaperEntry } from './TimetableWallpaperStudio'
import { Button } from '@/components/ui/button'

interface MyLineupPanelProps {
  festival: Festival
  activeDay?: DayLineup
  artists: Artist[]
  myLineupIds: string[]
  playlistReady: Set<string>
  bundleLoading: boolean
  bundleNotice: BundledAnonymousPlaylist | null
  onToggleArtist: (artistId: string) => void
  onClear: () => void
  onPlayYouTube: () => void
  onDismissBundleNotice?: () => void
}

function pickHint(festival: Festival): string {
  if (festival.lineupStage === 'stage3_timetable') {
    return '타임테이블에서 ☆를 눌러 아티스트를 담아 보세요. 겹치는 시간대도 한눈에 비교할 수 있어요.'
  }
  if (festival.lineupStage === 'stage2_daily') {
    return '일별 라인업에서 ☆를 눌러 담아 보세요.'
  }
  return '라인업에서 ☆를 눌러 담아 보세요.'
}

export default function MyLineupPanel({
  festival,
  activeDay,
  artists,
  myLineupIds,
  playlistReady,
  bundleLoading,
  bundleNotice,
  onToggleArtist,
  onClear,
  onPlayYouTube,
  onDismissBundleNotice,
}: MyLineupPanelProps) {
  const [studioOpen, setStudioOpen] = useState(false)
  const artistMap = new Map(artists.map((a) => [a.id, a]))
  const notice = bundleNotice ? bundleNoticeCopy(bundleNotice) : null

  const lineupOnDayIds = useMemo(
    () => filterMyLineupForDay(myLineupIds, activeDay),
    [myLineupIds, activeDay],
  )

  const selectedOnDay = lineupOnDayIds
    .map((id) => artistMap.get(id))
    .filter((a): a is Artist => !!a)

  const readyCount = lineupOnDayIds.filter((id) => playlistReady.has(id)).length
  const dayLabel = activeDay?.dayLabel ?? '라인업'

  return (
    <div className="my-lineup-panel">
      <div className="my-lineup-panel__head">
        <div>
          <h4 className="my-lineup-panel__title">내 라인업</h4>
          <p className="my-lineup-panel__lede">{pickHint(festival)}</p>
        </div>
        {lineupOnDayIds.length > 0 && (
          <button type="button" className="my-lineup-panel__clear" onClick={onClear}>
            {dayLabel} 비우기
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

      <div className="my-lineup-panel__picked">
        <p className="my-lineup-panel__picked-label">
          {dayLabel} 담은 아티스트 <strong>{lineupOnDayIds.length}</strong>
          {readyCount < lineupOnDayIds.length && (
            <span className="my-lineup-panel__picked-muted">
              {' '}
              · 대표곡 준비 {readyCount}팀
            </span>
          )}
        </p>
        {selectedOnDay.length === 0 ? (
          <p className="my-lineup-panel__empty">
            아직 담은 아티스트가 없어요. 라인업에서 ☆를 눌러 담아 보세요.
          </p>
        ) : (
          <ul className="my-lineup-panel__chips">
            {selectedOnDay.map((a) => (
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
        <Button
          className="my-lineup-panel__btn"
          disabled={readyCount === 0 || bundleLoading}
          onClick={onPlayYouTube}
        >
          {bundleLoading ? '여는 중…' : `${dayLabel} 대표곡 듣기`}
        </Button>
      </div>

      <TimetableWallpaperEntry
        festival={festival}
        activeDay={activeDay}
        myLineupIds={myLineupIds}
        onOpenStudio={() => setStudioOpen(true)}
      />

      <TimetableWallpaperStudio
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        festival={festival}
        activeDay={activeDay}
        artists={artists}
        myLineupIds={myLineupIds}
      />
    </div>
  )
}
