import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { FestivalStageStyle, TimetableSlot, Artist } from '../types'
import { officialArtistName } from '../lib/artistOfficialName'
import { stageThemeMap } from '../lib/stageTheme'
import MyLineupPickButton from './MyLineupPickButton'
import { blurAfterTap } from '../lib/blurAfterTap'

interface TimetableGridProps {
  stages: string[]
  slots: TimetableSlot[]
  artists: Artist[]
  stageStyles?: FestivalStageStyle[]
  selectedArtistId?: string
  onSlotClick: (artistId: string) => void
  isInMyLineup?: (artistId: string) => boolean
  myLineupArtistIds?: string[]
  onToggleMyLineup?: (artistId: string) => void
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export default function TimetableGrid({
  stages,
  slots,
  artists,
  stageStyles,
  selectedArtistId,
  onSlotClick,
  isInMyLineup,
  myLineupArtistIds = [],
  onToggleMyLineup,
}: TimetableGridProps) {
  const lineupSet = useMemo(() => new Set(myLineupArtistIds), [myLineupArtistIds])
  const themes = useMemo(() => stageThemeMap(stages, stageStyles), [stages, stageStyles])

  if (!slots || slots.length === 0 || !stages || stages.length === 0) {
    return (
      <div className="timetable-empty">
        타임테이블 정보가 없습니다.
      </div>
    )
  }

  const slotMinutes = slots.map((s) => ({
    ...s,
    startMin: timeToMinutes(s.startTime),
    endMin: timeToMinutes(s.endTime),
  }))

  const earliestStart = Math.min(...slotMinutes.map((s) => s.startMin))
  const latestEnd = Math.max(...slotMinutes.map((s) => s.endMin))
  const startLimit = earliestStart
  const endLimit = latestEnd
  const totalMinutes = Math.max(endLimit - startLimit, 30)
  const pxPerMin = 1.55
  const totalHeight = totalMinutes * pxPerMin

  const firstHour = Math.ceil(startLimit / 60)
  const lastHour = Math.floor(endLimit / 60)
  const hours: number[] = []
  for (let h = firstHour; h <= lastHour; h++) hours.push(h)

  const artistMap = new Map(artists.map((a) => [a.id, a]))
  const colTemplate = `var(--tt-axis) repeat(${stages.length}, minmax(0, 1fr))`

  return (
    <div
      className="tt"
      aria-label="타임테이블"
      style={{ ['--tt-px-per-min' as string]: String(pxPerMin) }}
    >
      <div className="tt-grid">
        <div className="tt-grid__header" style={{ gridTemplateColumns: colTemplate }}>
          <div className="tt-grid__corner" aria-hidden="true">
            시간
          </div>
          {stages.map((stage) => {
            const theme = themes.get(stage)!
            return (
              <div
                key={stage}
                className="tt-grid__stage"
                style={{ backgroundColor: theme.bg, color: theme.fg }}
                title={stage}
              >
                <span className="tt-grid__stage-short">{theme.shortLabel}</span>
                <span className="tt-grid__stage-full">{stage}</span>
              </div>
            )
          })}
        </div>

        <div
          className="tt-grid__body"
          style={{
            gridTemplateColumns: colTemplate,
            height: `${totalHeight}px`,
          }}
        >
          <div className="tt-grid__axis" aria-hidden="true">
            {hours.map((h) => {
              const topPos = (h * 60 - startLimit) * pxPerMin
              return (
                <div key={h} className="tt-grid__hour" style={{ top: `${topPos}px` }}>
                  {h}
                </div>
              )
            })}
          </div>

          <div className="tt-grid__lines" aria-hidden="true">
            {hours.map((h) => {
              const topPos = (h * 60 - startLimit) * pxPerMin
              return (
                <div key={h} className="tt-grid__line" style={{ top: `${topPos}px` }} />
              )
            })}
          </div>

          {stages.map((stageName, stageIdx) => {
            const theme = themes.get(stageName)!
            const stageSlots = slotMinutes.filter((s) => s.stageName === stageName)
            return (
              <div
                key={stageName}
                className={`tt-grid__col${stageIdx < stages.length - 1 ? ' has-border' : ''}`}
                style={{ backgroundColor: theme.soft }}
              >
                {stageSlots.map((slot, index) => {
                  const artist = artistMap.get(slot.artistId)
                  const artistName = artist ? officialArtistName(artist) : slot.artistId
                  const topPos = (slot.startMin - startLimit) * pxPerMin
                  const heightPos = slot.durationMinutes * pxPerMin
                  const isSelected = selectedArtistId === slot.artistId
                  const inLineup = lineupSet.has(slot.artistId) || (isInMyLineup?.(slot.artistId) ?? false)
                  const slotShellStyle = inLineup
                    ? ({
                        top: `${topPos + 1}px`,
                        height: `${Math.max(heightPos - 2, 28)}px`,
                        ['--slot-lineup-bg' as string]: theme.lineupBg,
                        ['--stage-accent' as string]: theme.accent,
                      } as CSSProperties)
                    : {
                        top: `${topPos + 1}px`,
                        height: `${Math.max(heightPos - 2, 28)}px`,
                      }

                  return (
                    <div
                      key={`${slot.artistId}-${index}`}
                      className={`tt-grid__slot-shell${inLineup ? ' is-in-lineup' : ''}`}
                      style={slotShellStyle}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          onSlotClick(slot.artistId)
                          blurAfterTap(e.currentTarget)
                        }}
                        className={`tt-grid__slot${inLineup ? ' is-in-lineup' : ''}`}
                        style={{ borderColor: theme.accent }}
                        aria-label={`${artistName}, ${stageName}, ${slot.startTime}부터 ${slot.endTime}까지`}
                        aria-current={isSelected ? 'true' : undefined}
                      >
                        <span className="tt-grid__slot-name">{artistName}</span>
                        <span className="tt-grid__slot-time">
                          {slot.startTime}–{slot.endTime}
                        </span>
                      </button>
                      {onToggleMyLineup && (
                        <MyLineupPickButton
                          active={inLineup}
                          className="lineup-pick-btn--tt"
                          onToggle={() => onToggleMyLineup(slot.artistId)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
