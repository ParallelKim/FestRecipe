import { useMemo, type CSSProperties } from 'react'
import type { MobileArtistView, MobileDayView, MobileStageTheme } from '../view/types'

interface MobileTimetableProps {
  day: MobileDayView
  stages: MobileStageTheme[]
  artists: Map<string, MobileArtistView>
  lineupIds: string[]
  selectedArtistId?: string
  onSlotClick: (artistId: string) => void
  onToggleLineup: (artistId: string) => void
  exportMode?: boolean
  wallpaperCompact?: boolean
  pxPerMin?: number
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export default function MobileTimetable({
  day,
  stages,
  artists,
  lineupIds,
  selectedArtistId,
  onSlotClick,
  onToggleLineup,
  exportMode = false,
  wallpaperCompact = false,
  pxPerMin: pxPerMinProp,
}: MobileTimetableProps) {
  const lineupSet = useMemo(() => new Set(lineupIds), [lineupIds])
  const themeMap = useMemo(
    () => new Map(stages.map((s) => [s.stageId, s])),
    [stages],
  )

  const stageIds = day.stageIds.length ? day.stageIds : stages.map((s) => s.stageId)
  const slots = day.slots

  if (!slots.length || !stageIds.length) {
    return (
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        타임테이블 정보가 없어요.
      </p>
    )
  }

  const slotMinutes = slots.map((s) => ({
    ...s,
    startMin: timeToMinutes(s.startTime),
    endMin: timeToMinutes(s.endTime),
  }))

  const startLimit = Math.min(...slotMinutes.map((s) => s.startMin))
  const endLimit = Math.max(...slotMinutes.map((s) => s.endMin))
  const totalMinutes = Math.max(endLimit - startLimit, 30)
  const pxPerMin = pxPerMinProp ?? (wallpaperCompact ? 1.12 : 1.55)
  const totalHeight = totalMinutes * pxPerMin

  const firstHour = Math.ceil(startLimit / 60)
  const lastHour = Math.floor(endLimit / 60)
  const hours: number[] = []
  for (let h = firstHour; h <= lastHour; h++) hours.push(h)

  const colTemplate = `var(--tt-axis) repeat(${stageIds.length}, minmax(0, 1fr))`

  return (
    <div
      className={`tt${exportMode ? ' tt--export' : ''}`}
      aria-label="타임테이블"
      style={{ ['--tt-px-per-min' as string]: String(pxPerMin) }}
    >
      <div className="tt-grid">
        <div className="tt-grid__header" style={{ gridTemplateColumns: colTemplate }}>
          <div className="tt-grid__corner" aria-hidden="true">시간</div>
          {stageIds.map((stageId) => {
            const theme = themeMap.get(stageId) ?? {
              stageId,
              label: stageId,
              shortLabel: stageId,
              bg: '#f3f4f6',
              fg: '#141414',
              accent: '#141414',
              lineupBg: '#f0f0f0',
            }
            return (
              <div
                key={stageId}
                className="tt-grid__stage"
                style={{ backgroundColor: theme.bg, color: theme.fg }}
                title={theme.label}
              >
                <span className="tt-grid__stage-short">{theme.shortLabel}</span>
                <span className="tt-grid__stage-full">{theme.label}</span>
              </div>
            )
          })}
        </div>

        <div
          className="tt-grid__body"
          style={{ gridTemplateColumns: colTemplate, height: `${totalHeight}px` }}
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

          {stageIds.map((stageId, stageIdx) => {
            const theme = themeMap.get(stageId) ?? {
              accent: '#141414',
              lineupBg: '#f0f0f0',
            }
            const stageSlots = slotMinutes.filter((s) => s.stageId === stageId)
            return (
              <div
                key={stageId}
                className={`tt-grid__col${stageIdx < stageIds.length - 1 ? ' has-border' : ''}`}
                style={{ ['--tt-col-accent' as string]: theme.accent } as CSSProperties}
              >
                {stageSlots.map((slot, index) => {
                  const artist = artists.get(slot.artistId)
                  const name = artist?.displayName ?? slot.artistId
                  const topPos = (slot.startMin - startLimit) * pxPerMin
                  const heightPos = slot.durationMinutes * pxPerMin
                  const inLineup = lineupSet.has(slot.artistId)
                  const isSelected = selectedArtistId === slot.artistId
                  const shellStyle = {
                    top: `${topPos + 1}px`,
                    height: `${Math.max(heightPos - 2, 28)}px`,
                    ['--stage-accent' as string]: theme.accent,
                    ...(inLineup ? { ['--slot-lineup-bg' as string]: theme.lineupBg } : {}),
                  } as CSSProperties

                  return (
                    <div
                      key={`${slot.artistId}-${index}`}
                      className={`tt-grid__slot-shell${inLineup ? ' is-in-lineup' : ''}`}
                      style={shellStyle}
                    >
                      <button
                        type="button"
                        className={`tt-grid__slot${inLineup ? ' is-in-lineup' : ''}`}
                        style={{ borderColor: theme.accent }}
                        aria-label={`${name}, ${slot.startTime}–${slot.endTime}`}
                        aria-current={isSelected ? 'true' : undefined}
                        tabIndex={exportMode ? -1 : undefined}
                        onClick={() => {
                          if (exportMode) return
                          onSlotClick(slot.artistId)
                        }}
                      >
                        <span className="tt-grid__slot-name">{name}</span>
                        <span className="tt-grid__slot-time">
                          {slot.startTime}–{slot.endTime}
                        </span>
                      </button>
                      {!exportMode && (
                        <button
                          type="button"
                          className={`lineup-pick-btn lineup-pick-btn--tt${inLineup ? ' is-on' : ''}`}
                          aria-pressed={inLineup}
                          aria-label={inLineup ? '내 라인업에서 빼기' : '내 라인업에 담기'}
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleLineup(slot.artistId)
                          }}
                        >
                          <span className="lineup-pick-btn__icon" aria-hidden="true">
                            {inLineup ? '★' : '☆'}
                          </span>
                        </button>
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
