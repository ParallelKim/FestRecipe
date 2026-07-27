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
  const startLimit = startHour * 60
  const endLimit = endHour * 60
  const totalMinutes = Math.max(endLimit - startLimit, 60)
  // Tall enough that 40min sets are readable with large artist names
  const pxPerMin = 4.5
  const totalHeight = totalMinutes * pxPerMin

  const hours: number[] = []
  for (let h = startHour; h <= endHour; h++) hours.push(h)

  const artistMap = new Map(artists.map((a) => [a.id, a]))
  const colTemplate = `var(--tt-axis) repeat(${stages.length}, minmax(0, 1fr))`

  return (
    <div className="tt" aria-label="타임테이블">
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
                  const isCompact = slot.durationMinutes < 35

                  return (
                    <button
                      key={`${slot.artistId}-${index}`}
                      type="button"
                      onClick={() => onSlotClick(slot.artistId)}
                      className={[
                        'tt-grid__slot',
                        isSelected ? 'is-selected' : '',
                        isCompact ? 'is-compact' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={{
                        top: `${topPos + 2}px`,
                        height: `${Math.max(heightPos - 4, 52)}px`,
                        borderColor: theme.accent,
                        backgroundColor: isSelected ? theme.bg : '#ffffff',
                        color: isSelected ? theme.fg : '#111418',
                      }}
                      aria-label={`${artistName}, ${stageName}, ${slot.startTime}부터 ${slot.endTime}까지`}
                    >
                      <span className="tt-grid__slot-name">{artistName}</span>
                      <span className="tt-grid__slot-time">
                        <span className="tt-grid__slot-start">{slot.startTime}</span>
                        <span className="tt-grid__slot-range">
                          –{slot.endTime}
                        </span>
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
