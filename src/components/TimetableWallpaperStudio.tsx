import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HexColorInput, HexColorPicker } from 'react-colorful'
import type { Artist, DayLineup, Festival } from '../types'
import TimetableGrid from './TimetableGrid'
import { downloadElementPng, preloadExportFonts } from '../lib/captureElementPng'
import { filterMyLineupForDay } from '../lib/lineupDay'
import {
  computeWallpaperPreviewSize,
  exportPixelRatioForFrame,
  resolveWallpaperProfile,
  WALLPAPER_PRESET_PROFILES,
  type WallpaperProfile,
} from '../lib/wallpaperDevice'
import {
  computeWallpaperScale,
  MAIN_TIMETABLE_REF_WIDTH,
} from '../lib/wallpaperLayout'
import { festivalShortLabel } from '../lib/festivalShortLabel'

type ProfileOptionId = 'device' | (typeof WALLPAPER_PRESET_PROFILES)[number]['id']

const WALLPAPER_BG_PRESETS = [
  { id: 'paper', label: '페이퍼', value: '#ffffff' },
  { id: 'linen', label: '리넨', value: '#f4f3f0' },
  { id: 'cream', label: '크림', value: '#f5e9d4' },
  { id: 'fog', label: '포그', value: '#eef1f4' },
  { id: 'night', label: '나이트', value: '#181d26' },
] as const

function normalizeHex(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  return m ? `#${m[1].toLowerCase()}` : hex.toLowerCase()
}

function pickerSafeHex(hex: string, fallback = '#f4f3f0'): string {
  const n = normalizeHex(hex)
  return /^#[0-9a-f]{6}$/.test(n) ? n : fallback
}

function isDarkWallpaperBg(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return false
  const n = parseInt(m[1], 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance < 0.42
}

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
  const sourceRef = useRef<HTMLDivElement>(null)
  const [profileId, setProfileId] = useState<ProfileOptionId>('device')
  const [profile, setProfile] = useState<WallpaperProfile>(() =>
    resolveWallpaperProfile('device'),
  )
  const [previewSize, setPreviewSize] = useState({ width: 320, height: 693 })
  const [bgColor, setBgColor] = useState<string>(WALLPAPER_BG_PRESETS[1].value)
  const [showSafeZones, setShowSafeZones] = useState(true)
  const [busy, setBusy] = useState(false)
  const [hexCustomOpen, setHexCustomOpen] = useState(false)
  const [showFestName, setShowFestName] = useState(false)
  const [showDayLabel, setShowDayLabel] = useState(false)
  const [scale, setScale] = useState(0.5)
  const [sourceHeight, setSourceHeight] = useState(600)

  const lineupOnDay = useMemo(
    () => filterMyLineupForDay(myLineupIds, activeDay),
    [myLineupIds, activeDay],
  )

  const canUse =
    festival.lineupStage === 'stage3_timetable' &&
    !!activeDay?.slots?.length &&
    !!activeDay.stages?.length

  const onDarkBg = isDarkWallpaperBg(bgColor)

  const remeasureScale = useCallback(() => {
    const frame = frameRef.current
    const source = sourceRef.current
    if (!frame || !source) return

    const sh = source.scrollHeight
    const sw = MAIN_TIMETABLE_REF_WIDTH
    setSourceHeight(sh)

    const frameW = frame.clientWidth
    const frameH = frame.clientHeight
    const padX = 10
    const padY = 8
    const maxW = frameW - padX * 2
    const maxH = Math.max(80, frameH - padY * 2)

    setScale(computeWallpaperScale(sw, sh, maxW, maxH))
  }, [])

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

  useLayoutEffect(() => {
    if (!open) return
    remeasureScale()
    const raf = requestAnimationFrame(remeasureScale)
    return () => cancelAnimationFrame(raf)
  }, [
    open,
    previewSize,
    profile,
    activeDay?.dayLabel,
    lineupOnDay.length,
    showFestName,
    showDayLabel,
    remeasureScale,
  ])

  useEffect(() => {
    if (!open) return
    const stage = stageRef.current
    if (!stage || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      refreshProfileAndPreview()
      remeasureScale()
    })
    ro.observe(stage)
    const frame = frameRef.current
    if (frame) ro.observe(frame)
    return () => ro.disconnect()
  }, [open, refreshProfileAndPreview, remeasureScale])

  // 저장 시 필요한 폰트 서브셋을 미리 받아 둔다
  useEffect(() => {
    if (!open || !activeDay) return
    const raf = requestAnimationFrame(() => {
      const sourceText = sourceRef.current?.textContent ?? ''
      preloadExportFonts(
        `${sourceText}${festivalShortLabel(festival)}${activeDay.dayLabel}`,
      )
    })
    return () => cancelAnimationFrame(raf)
  }, [open, activeDay, festival])

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

  const bgNorm = normalizeHex(bgColor)
  const activePresetId =
    WALLPAPER_BG_PRESETS.find((p) => normalizeHex(p.value) === bgNorm)?.id ?? null

  const pickerHex = useMemo(() => pickerSafeHex(bgColor), [bgColor])
  const festCaption = festivalShortLabel(festival)

  const scaledW = MAIN_TIMETABLE_REF_WIDTH * scale
  const scaledH = sourceHeight * scale

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
            className={`wallpaper-studio__canvas${onDarkBg ? ' wallpaper-studio__canvas--on-dark' : ''}`}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: bgColor,
            }}
          >
            <div className="wallpaper-studio__stack">
              <div className="wallpaper-studio__fit">
                <div
                  className="wallpaper-studio__scale-box"
                  style={{ width: scaledW, height: scaledH }}
                >
                  <div
                    ref={sourceRef}
                    className="wallpaper-studio__source"
                    style={{
                      width: MAIN_TIMETABLE_REF_WIDTH,
                      transform: `scale(${scale})`,
                    }}
                  >
                    {(showFestName || showDayLabel) && (
                      <div className="wallpaper-studio__meta">
                        {showFestName && (
                          <p className="wallpaper-studio__fest">{festCaption}</p>
                        )}
                        {showDayLabel && (
                          <p className="wallpaper-studio__day">{activeDay.dayLabel}</p>
                        )}
                      </div>
                    )}
                    <div className="timetable-scroll">
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
                  </div>
                </div>
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
        <div className="wallpaper-studio__control">
          <span className="wallpaper-studio__label">표시 (선택)</span>
          <div className="wallpaper-studio__toggles" role="group" aria-label="배경화면에 표시할 텍스트">
            <button
              type="button"
              className={`wallpaper-studio__toggle${showFestName ? ' is-on' : ''}`}
              aria-pressed={showFestName}
              onClick={() => setShowFestName((v) => !v)}
            >
              페스티벌명
            </button>
            <button
              type="button"
              className={`wallpaper-studio__toggle${showDayLabel ? ' is-on' : ''}`}
              aria-pressed={showDayLabel}
              onClick={() => setShowDayLabel((v) => !v)}
            >
              날짜
            </button>
          </div>
        </div>
        <div className="wallpaper-studio__control">
          <span className="wallpaper-studio__label">저장 해상도</span>
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
        </div>
        <div className="wallpaper-studio__control">
          <span className="wallpaper-studio__label">배경 톤</span>
          <div className="wallpaper-studio__tones" role="group" aria-label="배경 톤">
            {WALLPAPER_BG_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`wallpaper-studio__tone${activePresetId === preset.id ? ' is-active' : ''}`}
                aria-pressed={activePresetId === preset.id}
                onClick={() => {
                  setBgColor(preset.value)
                  setHexCustomOpen(false)
                }}
              >
                <span
                  className="wallpaper-studio__tone-swatch"
                  style={{ backgroundColor: preset.value }}
                  aria-hidden="true"
                />
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              className={`wallpaper-studio__tone${!activePresetId ? ' is-active' : ''}`}
              aria-pressed={!activePresetId}
              onClick={() => {
                setHexCustomOpen((open) => !open)
              }}
            >
              <span
                className="wallpaper-studio__tone-swatch"
                style={{ backgroundColor: !activePresetId ? bgColor : '#e8e6e1' }}
                aria-hidden="true"
              />
              직접 지정
            </button>
          </div>
          {hexCustomOpen && (
            <div className="wallpaper-studio__picker" role="group" aria-label="배경색 선택">
              <HexColorPicker
                color={pickerHex}
                onChange={setBgColor}
                className="wallpaper-studio__picker-surface"
              />
              <div className="wallpaper-studio__picker-meta">
                <span
                  className="wallpaper-studio__hex-preview"
                  style={{ backgroundColor: pickerHex }}
                  aria-hidden="true"
                />
                <HexColorInput
                  color={pickerHex}
                  prefixed
                  alpha={false}
                  className="wallpaper-studio__hex-input"
                  onChange={setBgColor}
                  aria-label="HEX 색상 코드"
                />
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          className={`wallpaper-studio__safe-toggle${showSafeZones ? ' is-on' : ''}`}
          aria-pressed={showSafeZones}
          onClick={() => setShowSafeZones((v) => !v)}
        >
          잠금화면 안전 영역 {showSafeZones ? '숨기기' : '보기'}
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
        배경색과 해상도를 고른 뒤 타임테이블만 저장합니다. 페스티벌명·날짜는 편집 화면에서 켤 수 있습니다.
        {lineupOnDay.length > 0 ? ' 내 라인업 강조는 타임테이블에 반영됩니다.' : ''}
      </p>
      <button type="button" className="btn-secondary wallpaper-entry__btn" onClick={onOpenStudio}>
        배경화면 편집
      </button>
    </div>
  )
}
