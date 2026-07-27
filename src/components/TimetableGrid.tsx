import type { TimetableSlot, Artist } from '../types'

interface TimetableGridProps {
  stages: string[]
  slots: TimetableSlot[]
  artists: Artist[]
  selectedArtistId?: string
  onSlotClick: (artistId: string) => void
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
    return { bg: '#f5d000', fg: '#141414', accent: '#f5d000', soft: '#fff8cc' }
  }
  if (n.includes('monster') || n.includes('몬스터')) {
    return { bg: '#7ac143', fg: '#141414', accent: '#7ac143', soft: '#e8f7d9' }
  }
  if (n.includes('stanley') || n.includes('스탠리')) {
    return { bg: '#1a1a1a', fg: '#ffffff', accent: '#3a3a3a', soft: '#f0f0f0' }
  }
  return { bg: '#181d26', fg: '#ffffff', accent: '#41454d', soft: '#f3f4f6' }
}

export default function TimetableGrid({
  stages,
  slots,
  artists,
  selectedArtistId,
  onSlotClick,
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
  const startHour = Math.floor(earliestStart / 60)
  const endHour = Math.ceil(latestEnd / 60)
  const startLimit = startHour * 60 - 10
  const endLimit = endHour * 60 + 10
  const totalMinutes = endLimit - startLimit
  const pxPerMin = 3.2
  const totalHeight = totalMinutes * pxPerMin

  const hours: number[] = []
  for (let h = startHour; h <= endHour; h++) hours.push(h)

  const artistMap = new Map(artists.map((a) => [a.id, a]))

  return (
    <div className="tt">
      {/* Mobile-first: stage-by-stage list (official TT right panel) — no horizontal scroll */}
      <div className="tt-list" aria-label="스테이지별 타임테이블">
        {stages.map((stageName) => {
          const theme = stageTheme(stageName)
          const stageSlots = slotMinutes
            .filter((s) => s.stageName === stageName)
            .sort((a, b) => a.startMin - b.startMin)

          return (
            <section key={stageName} className="tt-list__stage">
              <header
                className="tt-list__head"
                style={{ backgroundColor: theme.bg, color: theme.fg }}
              >
                {stageName}
              </header>
              <ul className="tt-list__rows">
                {stageSlots.map((slot, index) => {
                  const artist = artistMap.get(slot.artistId)
                  const artistName = artist ? artist.name : slot.artistId
                  const isSelected = selectedArtistId === slot.artistId
                  return (
                    <li key={`${slot.artistId}-${index}`}>
                      <button
                        type="button"
                        onClick={() => onSlotClick(slot.artistId)}
                        className={`tt-list__row${isSelected ? ' is-selected' : ''}`}
                        style={{
                          borderLeftColor: theme.accent,
                          backgroundColor: isSelected ? theme.bg : undefined,
                          color: isSelected ? theme.fg : undefined,
                        }}
                      >
                        <span className="tt-list__artist">{artistName}</span>
                        <span className="tt-list__time">
                          {slot.startTime}-{slot.endTime}
                          <span className="tt-list__dur">({slot.durationMinutes}min)</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      {/* Desktop+: compact visual grid that fits container width (no overflow) */}
      <div className="tt-grid" aria-hidden="true">
        <div
          className="tt-grid__header"
          style={{ gridTemplateColumns: `48px repeat(${stages.length}, minmax(0, 1fr))` }}
        >
          <div className="tt-grid__corner">TIME</div>
          {stages.map((stage) => {
            const theme = stageTheme(stage)
            return (
              <div
                key={stage}
                className="tt-grid__stage"
                style={{ backgroundColor: theme.bg, color: theme.fg }}
              >
                {stage}
              </div>
            )
          })}
        </div>

        <div
          className="tt-grid__body"
          style={{
            gridTemplateColumns: `48px repeat(${stages.length}, minmax(0, 1fr))`,
            height: `${totalHeight}px`,
          }}
        >
          <div className="tt-grid__axis">
            {hours.map((h) => {
              const topPos = (h * 60 - startLimit) * pxPerMin
              return (
                <div key={h} className="tt-grid__hour" style={{ top: `${topPos}px` }}>
                  {String(h).padStart(2, '0')}:00
                </div>
              )
            })}
          </div>

          <div className="tt-grid__lines">
            {hours.map((h) => {
              const topPos = (h * 60 - startLimit) * pxPerMin
              return (
                <div
                  key={h}
                  className={`tt-grid__line${h === startHour ? ' is-edge' : ''}`}
                  style={{ top: `${topPos}px` }}
                />
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
                  const artistName = artist ? artist.name : slot.artistId
                  const topPos = (slot.startMin - startLimit) * pxPerMin
                  const heightPos = slot.durationMinutes * pxPerMin
                  const isSelected = selectedArtistId === slot.artistId

                  return (
                    <button
                      key={`${slot.artistId}-${index}`}
                      type="button"
                      tabIndex={-1}
                      onClick={() => onSlotClick(slot.artistId)}
                      className={`tt-grid__slot${isSelected ? ' is-selected' : ''}`}
                      style={{
                        top: `${topPos + 2}px`,
                        height: `${Math.max(heightPos - 4, 36)}px`,
                        borderColor: theme.accent,
                        backgroundColor: isSelected ? theme.bg : '#fff',
                        color: isSelected ? theme.fg : '#181d26',
                      }}
                    >
                      <span className="tt-grid__slot-name">{artistName}</span>
                      <span className="tt-grid__slot-time">
                        {slot.startTime}-{slot.endTime}
                        <span>({slot.durationMinutes}min)</span>
                      </span>
                    </button>
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
