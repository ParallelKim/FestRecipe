import type { TimetableSlot, Artist } from '../types'

interface TimetableGridProps {
  stages: string[]
  slots: TimetableSlot[]
  artists: Artist[]
  selectedArtistId?: string
  onSlotClick: (artistId: string) => void
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
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
  const pxPerMin = 4
  const totalHeight = totalMinutes * pxPerMin

  const hours: number[] = []
  for (let h = startHour; h <= endHour; h++) hours.push(h)

  const artistMap = new Map(artists.map((a) => [a.id, a]))

  return (
    <div className="timetable">
      <div
        className="timetable__header"
        style={{ gridTemplateColumns: `64px repeat(${stages.length}, minmax(148px, 1fr))` }}
      >
        <div className="timetable__corner">TIME</div>
        {stages.map((stage) => (
          <div key={stage} className="timetable__stage">
            {stage}
          </div>
        ))}
      </div>

      <div
        className="timetable__body"
        style={{
          gridTemplateColumns: `64px repeat(${stages.length}, minmax(148px, 1fr))`,
          height: `${totalHeight}px`,
        }}
      >
        <div className="timetable__axis">
          {hours.map((h) => {
            const topPos = (h * 60 - startLimit) * pxPerMin
            return (
              <div
                key={h}
                className="timetable__hour"
                style={{ top: `${topPos}px` }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            )
          })}
        </div>

        <div className="timetable__lines">
          {hours.map((h) => {
            const topPos = (h * 60 - startLimit) * pxPerMin
            return (
              <div
                key={h}
                className={`timetable__line${h === startHour ? ' is-edge' : ''}`}
                style={{ top: `${topPos}px` }}
              />
            )
          })}
        </div>

        {stages.map((stageName, stageIdx) => {
          const stageSlots = slotMinutes.filter((s) => s.stageName === stageName)
          return (
            <div
              key={stageName}
              className={`timetable__col${stageIdx < stages.length - 1 ? ' has-border' : ''}`}
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
                    onClick={() => onSlotClick(slot.artistId)}
                    className={`timetable__slot${isSelected ? ' is-selected' : ''}`}
                    style={{
                      top: `${topPos + 3}px`,
                      height: `${Math.max(heightPos - 6, 44)}px`,
                    }}
                  >
                    <div className="timetable__slot-time">
                      <span>{slot.startTime}–{slot.endTime}</span>
                      <span>{slot.durationMinutes}분</span>
                    </div>
                    <div className="timetable__slot-name">{artistName}</div>
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
