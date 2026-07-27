import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Artist, DayLineup, Festival } from '../types'
import TimetableGrid from './TimetableGrid'
import { downloadElementPng } from '../lib/captureElementPng'
import { filterMyLineupForDay } from '../lib/lineupDay'

const ASPECT_PRESETS = [
  { id: '9-19.5', label: 'iPhone 세로 (9:19.5)', ratio: 9 / 19.5 },
  { id: '9-20', label: '안드로이드 세로 (9:20)', ratio: 9 / 20 },
  { id: '3-4', label: '3:4', ratio: 3 / 4 },
] as const

type AspectPresetId = (typeof ASPECT_PRESETS)[number]['id']

interface TimetableWallpaperStudioProps {
  open: boolean
  onClose: () => void
  festival: Festival
  activeDay?: DayLineup
  artists: Artist[]
  myLineupIds: string[]
}

export default function TimetableWallpaperStudio({
  open,
  onClose,
  festival,
  activeDay,
  artists,
  myLineupIds,
}: TimetableWallpaperStudioProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [aspectId, setAspectId] = useState<AspectPresetId>('9-19.5')
  const [zoom, setZoom] = useState(0.9)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [pixelRatio, setPixelRatio] = useState(2)
  const [busy, setBusy] = useState(false)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  const aspect = ASPECT_PRESETS.find((p) => p.id === aspectId) ?? ASPECT_PRESETS[0]
  const lineupOnDay = useMemo(
    () => filterMyLineupForDay(myLineupIds, activeDay),
    [myLineupIds, activeDay],
  )

  const canUse =
    festival.lineupStage === 'stage3_timetable' &&
    !!activeDay?.slots?.length &&
    !!activeDay.stages?.length

  useEffect(() => {
    if (!open) return
    setZoom(0.9)
    setPan({ x: 0, y: 0 })
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, activeDay?.dayLabel])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    setPan({
      x: drag.originX + (e.clientX - drag.startX),
      y: drag.originY + (e.clientY - drag.startY),
    })
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    dragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const handleSave = async () => {
    if (!frameRef.current || !activeDay) return
    setBusy(true)
    try {
      const slug = activeDay.dayLabel.replace(/[^\w가-힣]+/g, '-').slice(0, 32)
      await downloadElementPng(
        frameRef.current,
        `festrecipe-wallpaper-${slug}.png`,
        pixelRatio,
      )
    } finally {
      setBusy(false)
    }
  }

  if (!open || !canUse) return null

  return createPortal(
    <div className="wallpaper-studio" role="dialog" aria-modal="true" aria-label="배경화면 편집">
      <header className="wallpaper-studio__bar">
        <button type="button" className="wallpaper-studio__back" onClick={onClose}>
          닫기
        </button>
        <span className="wallpaper-studio__title">{activeDay.dayLabel} 배경화면</span>
        <button
          type="button"
          className="btn-primary wallpaper-studio__save"
          disabled={busy}
          onClick={handleSave}
        >
          {busy ? '저장 중…' : 'PNG 저장'}
        </button>
      </header>

      <p className="wallpaper-studio__hint">
        화면에 보이는 타임테이블 그대로 저장됩니다. 드래그로 위치를 맞추고, 확대·비율·선명도를 조절하세요.
      </p>

      <div className="wallpaper-studio__stage">
        <div
          ref={frameRef}
          className="wallpaper-studio__frame"
          style={{ aspectRatio: String(aspect.ratio) }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div
            className="wallpaper-studio__content"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <div className="wallpaper-studio__meta">
              <p className="wallpaper-studio__fest">{festival.name}</p>
              <p className="wallpaper-studio__day">{activeDay.dayLabel}</p>
              {lineupOnDay.length > 0 && (
                <p className="wallpaper-studio__lineup">내 라인업 {lineupOnDay.length}팀 강조</p>
              )}
            </div>
            <div className="wallpaper-studio__grid">
              <TimetableGrid
                stages={activeDay.stages!}
                slots={activeDay.slots!}
                artists={artists}
                stageStyles={festival.stageStyles}
                exportMode
                onSlotClick={() => {}}
                myLineupArtistIds={lineupOnDay}
              />
            </div>
            <p className="wallpaper-studio__brand">FestRecipe</p>
          </div>
        </div>
      </div>

      <div className="wallpaper-studio__controls">
        <label className="wallpaper-studio__control">
          <span>화면 비율</span>
          <select
            className="wallpaper-studio__select"
            value={aspectId}
            onChange={(e) => setAspectId(e.target.value as AspectPresetId)}
          >
            {ASPECT_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="wallpaper-studio__control">
          <span>확대 {Math.round(zoom * 100)}%</span>
          <input
            type="range"
            className="wallpaper-studio__range"
            min={0.35}
            max={2}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        <label className="wallpaper-studio__control">
          <span>저장 선명도 ×{pixelRatio}</span>
          <input
            type="range"
            className="wallpaper-studio__range"
            min={1}
            max={4}
            step={0.5}
            value={pixelRatio}
            onChange={(e) => setPixelRatio(Number(e.target.value))}
          />
        </label>
      </div>
    </div>,
    document.body,
  )
}

/** FAB 패널용 진입 버튼 + 안내 */
export function TimetableWallpaperEntry({
  festival,
  activeDay,
  myLineupIds,
  onOpenStudio,
}: {
  festival: Festival
  activeDay?: DayLineup
  myLineupIds: string[]
  onOpenStudio: () => void
}) {
  const canUse =
    festival.lineupStage === 'stage3_timetable' &&
    !!activeDay?.slots?.length &&
    !!activeDay.stages?.length

  const lineupOnDay = filterMyLineupForDay(myLineupIds, activeDay)

  if (!canUse) {
    return (
      <div className="wallpaper-entry wallpaper-entry--disabled">
        <h5 className="wallpaper-entry__title">배경화면 타임테이블</h5>
        <p className="wallpaper-entry__hint">
          타임테이블이 공개되면, 선택한 일자 화면을 그대로 배경화면으로 저장할 수 있습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="wallpaper-entry">
      <h5 className="wallpaper-entry__title">배경화면 타임테이블</h5>
      <p className="wallpaper-entry__hint">
        <strong>{activeDay?.dayLabel}</strong> 타임테이블 UI를 크롭·확대해 저장합니다.
        {lineupOnDay.length > 0
          ? ` 내 라인업 ${lineupOnDay.length}팀이 강조됩니다.`
          : ' ☆로 담은 아티스트가 슬롯에 강조됩니다.'}
      </p>
      <button type="button" className="btn-secondary wallpaper-entry__btn" onClick={onOpenStudio}>
        배경화면 편집
      </button>
    </div>
  )
}
