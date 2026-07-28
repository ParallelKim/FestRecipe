import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Artist, DayLineup, Festival } from '../types'
import TimetableGrid from './TimetableGrid'
import { downloadElementPng } from '../lib/captureElementPng'
import { filterMyLineupForDay } from '../lib/lineupDay'
import {
  computeWallpaperPreviewSize,
  exportPixelRatioForFrame,
  resolveWallpaperProfile,
  WALLPAPER_PRESET_PROFILES,
  type WallpaperProfile,
} from '../lib/wallpaperDevice'
import { computeWallpaperPxPerMin } from '../lib/wallpaperLayout'

const META_TEXT_PX = 52
const BRAND_BLOCK_PX = 28
const FRAME_PADDING_Y = 12

type ProfileOptionId = 'device' | (typeof WALLPAPER_PRESET_PROFILES)[number]['id']

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
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [profileId, setProfileId] = useState<ProfileOptionId>('device')
  const [profile, setProfile] = useState<WallpaperProfile>(() =>
    resolveWallpaperProfile('device'),
  )
  const [previewSize, setPreviewSize] = useState({ width: 320, height: 693 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showSafeZones, setShowSafeZones] = useState(true)
  const [busy, setBusy] = useState(false)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  const lineupOnDay = useMemo(
    () => filterMyLineupForDay(myLineupIds, activeDay),
    [myLineupIds, activeDay],
  )

  const canUse =
    festival.lineupStage === 'stage3_timetable' &&
    !!activeDay?.slots?.length &&
    !!activeDay.stages?.length

  const layout = useMemo(() => {
    const frameH = previewSize.height
    const safeTop = frameH * profile.safeTopRatio
    const safeBottom = frameH * profile.safeBottomRatio
    const gridAreaHeight =
      frameH -
      safeTop -
      safeBottom -
      META_TEXT_PX -
      BRAND_BLOCK_PX -
      FRAME_PADDING_Y
    const slots = activeDay?.slots ?? []
    const pxPerMin = computeWallpaperPxPerMin(slots, Math.max(120, gridAreaHeight))
    return { pxPerMin, safeTop, safeBottom, gridAreaHeight }
  }, [previewSize.height, profile, activeDay?.slots])

  const refreshProfileAndPreview = useCallback(() => {
    const nextProfile = resolveWallpaperProfile(profileId)
    setProfile(nextProfile)
    const stage = stageRef.current
    if (!stage) return
    setPreviewSize(
      computeWallpaperPreviewSize(
        nextProfile,
        stage.clientWidth,
        stage.clientHeight,
      ),
    )
  }, [profileId])

  useEffect(() => {
    if (!open) return
    setZoom(1)
    setPan({ x: 0, y: 0 })
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, activeDay?.dayLabel])

  useLayoutEffect(() => {
    if (!open) return
    refreshProfileAndPreview()
    const raf = requestAnimationFrame(refreshProfileAndPreview)
    return () => cancelAnimationFrame(raf)
  }, [open, profileId, activeDay?.dayLabel, refreshProfileAndPreview])

  useEffect(() => {
    if (!open) return
    const stage = stageRef.current
    if (!stage || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => refreshProfileAndPreview())
    ro.observe(stage)
    return () => ro.disconnect()
  }, [open, refreshProfileAndPreview])

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
      const exportRatio = exportPixelRatioForFrame(profile, frameRef.current.clientWidth)
      await downloadElementPng(
        frameRef.current,
        `festrecipe-wallpaper-${profile.id}-${slug}.png`,
        exportRatio,
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
        미리보기는 선택한 해상도 비율의 잠금화면입니다. 타임테이블은 가로를 꽉 채우고, 상·하단
        노란 영역은 시계·독에 가려질 수 있어요. 저장 시 <strong>{profile.width}×{profile.height}px</strong>
        로 보냅니다.
      </p>

      <div ref={stageRef} className="wallpaper-studio__stage">
        <div
          className="wallpaper-studio__preview"
          style={{
            width: previewSize.width,
            height: previewSize.height,
          }}
        >
          <div
            ref={frameRef}
            className="wallpaper-studio__frame"
            style={{
              width: '100%',
              height: '100%',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              className="wallpaper-studio__transform"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              <div className="wallpaper-studio__content">
                <div
                  className="wallpaper-studio__meta"
                  style={{ paddingTop: layout.safeTop }}
                >
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
                    pxPerMin={layout.pxPerMin}
                    onSlotClick={() => {}}
                    myLineupArtistIds={lineupOnDay}
                  />
                </div>
                <p
                  className="wallpaper-studio__brand"
                  style={{ paddingBottom: layout.safeBottom }}
                >
                  FestRecipe
                </p>
              </div>
            </div>
          </div>
          {showSafeZones && (
            <div className="wallpaper-studio__safe" aria-hidden="true">
              <div
                className="wallpaper-studio__safe-band wallpaper-studio__safe-band--top"
                style={{ height: `${profile.safeTopRatio * 100}%` }}
              />
              <div
                className="wallpaper-studio__safe-band wallpaper-studio__safe-band--bottom"
                style={{ height: `${profile.safeBottomRatio * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="wallpaper-studio__controls">
        <label className="wallpaper-studio__control">
          <span>저장 해상도</span>
          <select
            className="wallpaper-studio__select"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value as ProfileOptionId)}
          >
            <option value="device">이 기기 (화면·DPR 기준)</option>
            {WALLPAPER_PRESET_PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="wallpaper-studio__control wallpaper-studio__control--row">
          <input
            type="checkbox"
            checked={showSafeZones}
            onChange={(e) => setShowSafeZones(e.target.checked)}
          />
          <span>잠금화면 안전 영역 표시</span>
        </label>
        <label className="wallpaper-studio__control">
          <span>미세 조정 확대 {Math.round(zoom * 100)}%</span>
          <input
            type="range"
            className="wallpaper-studio__range"
            min={0.85}
            max={1.25}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          className="btn-secondary wallpaper-studio__fit"
          onClick={() => {
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }}
        >
          위치·확대 초기화
        </button>
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
        <strong>{activeDay?.dayLabel}</strong> 타임테이블을 스마트폰 세로 해상도에 맞춰 저장합니다.
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
