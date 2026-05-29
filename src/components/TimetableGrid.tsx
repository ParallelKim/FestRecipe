import type { TimetableSlot, Artist } from '../types'

interface TimetableGridProps {
  stages: string[]
  slots: TimetableSlot[]
  artists: Artist[]
  selectedArtistId?: string
  onSlotClick: (artistId: string) => void
}

// Convert "HH:MM" to minutes from midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export default function TimetableGrid({
  stages,
  slots,
  artists,
  selectedArtistId,
  onSlotClick
}: TimetableGridProps) {
  if (!slots || slots.length === 0 || !stages || stages.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-muted)', border: '1px dashed var(--color-hairline)', borderRadius: 'var(--radius-md)' }}>
        타임테이블 정보가 없습니다.
      </div>
    )
  }

  // Find the overall start and end bounds
  const slotMinutes = slots.map(s => ({
    ...s,
    startMin: timeToMinutes(s.startTime),
    endMin: timeToMinutes(s.endTime)
  }))

  const earliestStart = Math.min(...slotMinutes.map(s => s.startMin))
  const latestEnd = Math.max(...slotMinutes.map(s => s.endMin))

  // Round start down to the nearest hour, end up to the nearest hour
  const startHour = Math.floor(earliestStart / 60)
  const endHour = Math.ceil(latestEnd / 60)

  // Add 10 minutes of padding to the top and bottom of the timeline
  const startLimit = startHour * 60 - 10
  const endLimit = endHour * 60 + 10
  const totalMinutes = endLimit - startLimit

  // Grid scaling factor (height in pixels per minute)
  const pxPerMin = 3.5
  const totalHeight = totalMinutes * pxPerMin

  // Create list of hours to show on the time axis
  const hours: number[] = []
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h)
  }

  const artistMap = new Map(artists.map(a => [a.id, a]))

  return (
    <div style={{
      border: '1px solid var(--color-hairline)',
      borderRadius: 'var(--radius-lg)',
      backgroundColor: 'var(--color-surface-soft)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-card)'
    }}>
      {/* Header with Stage Names */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `80px repeat(${stages.length}, minmax(130px, 1fr))`,
        borderBottom: '1px solid var(--color-hairline)',
        backgroundColor: 'var(--color-canvas)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        {/* Empty corner cell */}
        <div style={{
          borderRight: '1px solid var(--color-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--color-muted)',
          backgroundColor: 'var(--color-surface-soft)'
        }}>
          TIME
        </div>
        {stages.map(stage => (
          <div
            key={stage}
            style={{
              padding: '16px 8px',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '14px',
              color: 'var(--color-ink)',
              borderRight: '1px solid var(--color-hairline)',
              letterSpacing: '-0.3px'
            }}
          >
            {stage}
          </div>
        ))}
      </div>

      {/* Grid Content with Sticky Time Axis */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `80px repeat(${stages.length}, minmax(130px, 1fr))`,
        position: 'relative',
        height: `${totalHeight}px`,
        overflow: 'visible'
      }}>
        
        {/* Time Axis Column */}
        <div style={{
          position: 'sticky',
          left: 0,
          width: '80px',
          height: '100%',
          backgroundColor: 'var(--color-canvas)',
          borderRight: '1px solid var(--color-hairline)',
          zIndex: 5,
          pointerEvents: 'none' // Click through to background if necessary
        }}>
          {hours.map((h) => {
            const topPos = (h * 60 - startLimit) * pxPerMin
            return (
              <div
                key={h}
                style={{
                  position: 'absolute',
                  top: `${topPos}px`,
                  left: 0,
                  width: '100%',
                  transform: 'translateY(-50%)',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-muted)'
                }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            )
          })}
        </div>

        {/* Hour Grid Lines Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '80px',
          right: 0,
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {hours.map((h) => {
            const topPos = (h * 60 - startLimit) * pxPerMin
            return (
              <div
                key={h}
                style={{
                  position: 'absolute',
                  top: `${topPos}px`,
                  left: 0,
                  right: 0,
                  borderTop: h === startHour ? 'none' : '1px dashed var(--color-hairline)'
                }}
              />
            )
          })}
        </div>

        {/* Stage Columns for Slots */}
        {stages.map((stageName, stageIdx) => {
          const stageSlots = slotMinutes.filter(s => s.stageName === stageName)
          
          return (
            <div
              key={stageName}
              style={{
                position: 'relative',
                height: '100%',
                borderRight: stageIdx < stages.length - 1 ? '1px solid var(--color-hairline)' : 'none',
                zIndex: 2
              }}
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
                    onClick={() => onSlotClick(slot.artistId)}
                    style={{
                      position: 'absolute',
                      top: `${topPos + 4}px`, // 4px padding top/bottom to prevent overlapping edges
                      left: '8px',
                      right: '8px',
                      height: `${heightPos - 8}px`,
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--color-ink)' : 'var(--color-canvas)',
                      color: isSelected ? '#ffffff' : 'var(--color-ink)',
                      border: isSelected ? '2px solid var(--color-ink)' : '1px solid var(--color-hairline)',
                      boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : 'var(--shadow-card)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ width: '100%' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--color-muted)',
                        marginBottom: '4px'
                      }}>
                        <span>{slot.startTime} - {slot.endTime}</span>
                        <span>{slot.durationMinutes}m</span>
                      </div>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        lineHeight: 1.2,
                        wordBreak: 'break-all'
                      }}>
                        {artistName}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })}

      </div>
    </div>
  )
}
