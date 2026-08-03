import { useState } from 'react'
import type { Artist, Festival, DayLineup } from '../../types'
import type { BundledAnonymousPlaylist } from '../../lib/bundlePlaylist'
import { bundleNoticeCopy } from '../../lib/bundlePlaylist'
import { filterMyLineupForDay } from '../../lib/lineupDay'
import { officialArtistName } from '../../lib/artistOfficialName'
import TimetableWallpaperStudio from '../../components/TimetableWallpaperStudio'
import FmDayPicker from './FmDayPicker'

interface FmPlanViewProps {
  festival: Festival
  activeDay?: DayLineup
  activeDayIndex: number
  onDayChange: (index: number) => void
  artists: Artist[]
  myLineupIds: string[]
  playlistReady: Set<string>
  bundleLoading: 'day' | 'festival' | 'custom' | null
  bundleNotice: BundledAnonymousPlaylist | null
  onDismissBundleNotice: () => void
  onOpenDayBundle: () => void
  onOpenFestivalBundle: () => void
  onOpenLineupPlaylist: () => void
  onClearLineup: () => void
  onRemoveFromLineup: (artistId: string) => void
  onArtistClick: (artistId: string) => void
}

/**
 * 계획 탭 — 모아 듣기 / 내 라인업 / 배경화면을 역할별로 분리.
 * 날짜는 상단 DayPicker 한 곳만. YouTube CTA는 라인업에만.
 */
export default function FmPlanView({
  festival,
  activeDay,
  activeDayIndex,
  onDayChange,
  artists,
  myLineupIds,
  playlistReady,
  bundleLoading,
  bundleNotice,
  onDismissBundleNotice,
  onOpenDayBundle,
  onOpenFestivalBundle,
  onOpenLineupPlaylist,
  onClearLineup,
  onRemoveFromLineup,
  onArtistClick,
}: FmPlanViewProps) {
  const [wallpaperOpen, setWallpaperOpen] = useState(false)
  const artistMap = new Map(artists.map((a) => [a.id, a]))

  const lineupOnDay = filterMyLineupForDay(myLineupIds, activeDay)
  const readyCount = lineupOnDay.filter((id) => playlistReady.has(id)).length
  const dayArtistIds = activeDay?.artists?.length
    ? activeDay.artists
    : (activeDay?.slots || []).map((s) => s.artistId)
  const dayReadyCount = dayArtistIds.filter((id) => playlistReady.has(id)).length
  const festivalReadyCount = (festival.allArtists || []).filter((id) =>
    playlistReady.has(id),
  ).length

  const notice = bundleNotice ? bundleNoticeCopy(bundleNotice) : null
  const canLineupPlay = readyCount > 0 && bundleLoading !== 'custom'

  return (
    <div className="fm2-plan">
      <FmDayPicker
        days={festival.lineup}
        activeIndex={activeDayIndex}
        onChange={onDayChange}
      />

      {notice && (
        <div
          className={`fm2-notice${bundleNotice?.truncated || bundleNotice?.thinCoverage ? ' is-warn' : ''}`}
          role="status"
        >
          <p className="fm2-notice__title">{notice.title}</p>
          <p className="fm2-notice__body">{notice.body}</p>
          <button type="button" className="fm2-btn fm2-btn--ghost" onClick={onDismissBundleNotice}>
            확인
          </button>
        </div>
      )}

      <section className="fm2-block">
        <h2 className="fm2-block__title">모아 듣기</h2>
        <p className="fm2-block__desc">선택한 날짜나 페스티벌 전체 대표곡을 YouTube로 열어요.</p>
        <div className="fm2-listen-row">
          <button
            type="button"
            className="fm2-btn fm2-btn--primary"
            disabled={bundleLoading !== null || dayReadyCount === 0}
            onClick={onOpenDayBundle}
          >
            {bundleLoading === 'day' ? '여는 중…' : '이 날'}
          </button>
          <button
            type="button"
            className="fm2-btn fm2-btn--outline"
            disabled={bundleLoading !== null || festivalReadyCount === 0}
            onClick={onOpenFestivalBundle}
          >
            {bundleLoading === 'festival' ? '여는 중…' : '페스티벌 전체'}
          </button>
        </div>
      </section>

      <section className="fm2-block">
        <div className="fm2-block__head">
          <h2 className="fm2-block__title">내 라인업</h2>
          {lineupOnDay.length > 0 && (
            <button type="button" className="fm2-block__action" onClick={onClearLineup}>
              비우기
            </button>
          )}
        </div>

        {lineupOnDay.length === 0 ? (
          <p className="fm2-empty">스케줄 탭에서 ☆를 눌러 담아 보세요.</p>
        ) : (
          <>
            <p className="fm2-lineup-meta">
              {lineupOnDay.length}팀 · 대표곡 준비 {readyCount}/{lineupOnDay.length}
            </p>
            <ul className="fm2-chips">
              {lineupOnDay.map((id) => {
                const artist = artistMap.get(id)
                if (!artist) return null
                return (
                  <li key={id} className="fm2-chip">
                    <button
                      type="button"
                      className="fm2-chip__name"
                      onClick={() => onArtistClick(id)}
                    >
                      {officialArtistName(artist)}
                    </button>
                    <button
                      type="button"
                      className="fm2-chip__remove"
                      onClick={() => onRemoveFromLineup(id)}
                      aria-label={`${officialArtistName(artist)} 빼기`}
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>
            <button
              type="button"
              className="fm2-btn fm2-btn--outline fm2-btn--block"
              disabled={!canLineupPlay}
              onClick={onOpenLineupPlaylist}
            >
              {bundleLoading === 'custom' ? '여는 중…' : '내 라인업 YouTube로'}
            </button>
          </>
        )}
      </section>

      {festival.lineupStage === 'stage3_timetable' && (
        <section className="fm2-block fm2-block--wallpaper">
          <h2 className="fm2-block__title">배경화면</h2>
          <p className="fm2-block__desc">
            타임테이블을 화면 비율에 맞춰 이미지로 저장해요.
          </p>
          <button
            type="button"
            className="fm2-btn fm2-btn--outline fm2-btn--block"
            onClick={() => setWallpaperOpen(true)}
          >
            배경화면 만들기
          </button>
        </section>
      )}

      <TimetableWallpaperStudio
        open={wallpaperOpen}
        onClose={() => setWallpaperOpen(false)}
        festival={festival}
        activeDay={activeDay}
        artists={artists}
        myLineupIds={myLineupIds}
      />
    </div>
  )
}
