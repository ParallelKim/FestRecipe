import type { Artist, Festival, DayLineup } from '../../types'
import { filterMyLineupForDay } from '../../lib/lineupDay'
import { officialArtistName } from '../../lib/artistOfficialName'
import TimetableGrid from '../../components/TimetableGrid'
import FmDayPicker from './FmDayPicker'

interface FmScheduleViewProps {
  festival: Festival
  activeDay?: DayLineup
  activeDayIndex: number
  onDayChange: (index: number) => void
  artists: Artist[]
  myLineupIds: string[]
  playlistReady: Set<string>
  selectedArtistId?: string
  onArtistClick: (artistId: string) => void
  onToggleLineup: (artistId: string) => void
}

/** 스케줄만 — 듣기·라인업 UI 없음 */
export default function FmScheduleView({
  festival,
  activeDay,
  activeDayIndex,
  onDayChange,
  artists,
  myLineupIds,
  playlistReady,
  selectedArtistId,
  onArtistClick,
  onToggleLineup,
}: FmScheduleViewProps) {
  const artistMap = new Map(artists.map((a) => [a.id, a]))
  const lineupOnDay = filterMyLineupForDay(myLineupIds, activeDay)

  return (
    <div className="fm2-schedule">
      <FmDayPicker
        days={festival.lineup}
        activeIndex={activeDayIndex}
        onChange={onDayChange}
      />

      <p className="fm2-schedule__hint">
        슬롯을 누르면 대표곡이 열려요. ☆로 담은 뒤 <strong>계획</strong> 탭에서 모아 들을 수 있어요.
      </p>

      {festival.lineupStage === 'stage3_timetable' && (
        <div className="fm2-schedule__grid-wrap timetable-scroll">
          <TimetableGrid
            stages={activeDay?.stages || []}
            slots={activeDay?.slots || []}
            artists={artists}
            stageStyles={festival.stageStyles}
            selectedArtistId={selectedArtistId}
            onSlotClick={onArtistClick}
            myLineupArtistIds={lineupOnDay}
            isInMyLineup={(id) => myLineupIds.includes(id)}
            onToggleMyLineup={onToggleLineup}
          />
        </div>
      )}

      {festival.lineupStage === 'stage1_all' && (
        <ul className="fm2-artist-list">
          {festival.allArtists.map((id) => {
            const artist = artistMap.get(id)
            if (!artist) return null
            const ready = playlistReady.has(id)
            const inLineup = myLineupIds.includes(id)
            return (
              <li key={id} className="fm2-artist-row">
                <button
                  type="button"
                  className={`fm2-artist-row__main${selectedArtistId === id ? ' is-selected' : ''}`}
                  onClick={() => onArtistClick(id)}
                >
                  <span className="fm2-artist-row__name">{officialArtistName(artist)}</span>
                  <span className="fm2-artist-row__badge">
                    {ready ? '대표곡 준비' : '준비 중'}
                  </span>
                </button>
                <button
                  type="button"
                  className={`fm2-artist-row__star${inLineup ? ' is-on' : ''}`}
                  onClick={() => onToggleLineup(id)}
                  aria-label={inLineup ? '라인업에서 빼기' : '라인업에 담기'}
                >
                  {inLineup ? '★' : '☆'}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {festival.lineupStage === 'stage2_daily' && (
        <ul className="fm2-artist-list">
          {(activeDay?.artists || []).map((id) => {
            const artist = artistMap.get(id)
            if (!artist) return null
            const ready = playlistReady.has(id)
            const inLineup = myLineupIds.includes(id)
            return (
              <li key={id} className="fm2-artist-row">
                <button
                  type="button"
                  className={`fm2-artist-row__main${selectedArtistId === id ? ' is-selected' : ''}`}
                  onClick={() => onArtistClick(id)}
                >
                  <span className="fm2-artist-row__name">{officialArtistName(artist)}</span>
                  <span className="fm2-artist-row__badge">
                    {ready ? '대표곡 준비' : '준비 중'}
                  </span>
                </button>
                <button
                  type="button"
                  className={`fm2-artist-row__star${inLineup ? ' is-on' : ''}`}
                  onClick={() => onToggleLineup(id)}
                  aria-label={inLineup ? '라인업에서 빼기' : '라인업에 담기'}
                >
                  {inLineup ? '★' : '☆'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
