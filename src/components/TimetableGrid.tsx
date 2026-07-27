import type { TimetableSlot, Artist } from '../types'
import { officialArtistName } from '../lib/artistOfficialName'
import MyLineupPickButton from './MyLineupPickButton'

interface TimetableGridProps {
  stages: string[]
  slots: TimetableSlot[]
  artists: Artist[]
  selectedArtistId?: string
  onSlotClick: (artistId: string) => void
  isInMyLineup?: (artistId: string) => boolean
  onToggleMyLineup?: (artistId: string) => void
}

type StageTheme = {
  bg: string
  fg: string
  accent: string
  soft: string
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/** Official Pentaport timetable color coding */
function stageTheme(stageName: string): StageTheme {
  const n = stageName.replace(/\s+/g, '').toLowerCase()
  if (n.includes('kb') || n.includes('국민')) {
    return { bg: '#f5d000', fg: '#141414', accent: '#c9a800', soft: '#fff6b8' }
  }
  if (n.includes('monster') || n.includes('몬스터')) {
    return { bg: '#7ac143', fg: '#141414', accent: '#5a9a2e', soft: '#dff5c8' }
  }
  if (n.includes('stanley') || n.includes('스탠리')) {
    return { bg: '#1a1a1a', fg: '#ffffff', accent: '#1a1a1a', soft: '#ececec' }
  }
  return { bg: '#181d26', fg: '#ffffff', accent: '#41454d', soft: '#f3f4f6' }
}

function shortStageLabel(stageName: string): string {
  const n = stageName.replace(/\s+/g, '').toLowerCase()
  if (n.includes('kb') || n.includes('국민')) return 'KB'
  if (n.includes('monster') || n.includes('몬스터')) return '몬스터'
  if (n.includes('stanley') || n.includes('스탠리')) return '스탠리'
  return stageName.length > 6 ? `${stageName.slice(0, 6)}…` : stageName
}

export default function TimetableGrid({
  stages,
  slots,
  artists,
  selectedArtistId,
  onSlotClick,
  isInMyLineup,
  onToggleMyLineup,
}: TimetableGridProps) {
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
  // Align to content — avoid empty hour padding above the first set
  const startLimit = earliestStart
  const endLimit = latestEnd
  const totalMinutes = Math.max(endLimit - startLimit, 30)
  // Duration-proportional but dense enough that 40min ≈ ~60px (not half-empty)
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
            const theme = stageTheme(stage)
            return (
              <div
                key={stage}
                className="tt-grid__stage"
                style={{ backgroundColor: theme.bg, color: theme.fg }}
                title={stage}
              >
                <span className="tt-grid__stage-short">{shortStageLabel(stage)}</span>
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
            const theme = stageTheme(stageName)
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
                  const inLineup = isInMyLineup?.(slot.artistId) ?? false

                  return (
                    <div
                      key={`${slot.artistId}-${index}`}
                      className={`tt-grid__slot-shell${isSelected ? ' is-selected' : ''}${inLineup ? ' is-in-lineup' : ''}`}
                      style={{
                        top: `${topPos + 1}px`,
                        height: `${Math.max(heightPos - 2, 28)}px`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onSlotClick(slot.artistId)}
                        className={`tt-grid__slot${isSelected ? ' is-selected' : ''}`}
                        style={{
                          borderColor: theme.accent,
                          backgroundColor: isSelected ? theme.bg : '#ffffff',
                          color: isSelected ? theme.fg : '#111418',
                        }}
                        aria-label={`${artistName}, ${stageName}, ${slot.startTime}부터 ${slot.endTime}까지`}
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
