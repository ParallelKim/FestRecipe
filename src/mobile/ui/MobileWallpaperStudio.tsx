import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { XIcon } from 'lucide-react'
import type { MobileArtistView, MobileDayView, MobileFestivalView } from '../view/types'
import { festivalShortLabel, lineupIdsOnDay } from '../lib/lineup'
import MobileTimetable from './MobileTimetable'
import { downloadElementPng, preloadExportFonts } from '../../lib/captureElementPng'
import {
  computeWallpaperPreviewSize,
  exportPixelRatioForFrame,
  resolveWallpaperProfile,
  WALLPAPER_PRESET_PROFILES,
  type WallpaperProfile,
} from '../../lib/wallpaperDevice'
import {
  computeWallpaperScale,
  MAIN_TIMETABLE_REF_WIDTH,
} from '../../lib/wallpaperLayout'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'

type ProfileOptionId = 'device' | (typeof WALLPAPER_PRESET_PROFILES)[number]['id']

const BG_PRESETS = [
  { id: 'paper', label: '페이퍼', value: '#ffffff' },
  { id: 'linen', label: '리넨', value: '#f4f3f0' },
  { id: 'cream', label: '크림', value: '#f5e9d4' },
  { id: 'fog', label: '포그', value: '#eef1f4' },
  { id: 'night', label: '나이트', value: '#181d26' },
] as const

interface MobileWallpaperStudioProps {
  open: boolean
  onClose: () => void
  festival: MobileFestivalView
  day: MobileDayView
  artists: Map<string, MobileArtistView>
  lineupIds: string[]
}

export default function MobileWallpaperStudio({
  open,
  onClose,
  festival,
  day,
  artists,
  lineupIds,
}: MobileWallpaperStudioProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const fitRef = useRef<HTMLDivElement>(null)
  const sourceRef = useRef<HTMLDivElement>(null)

  const [profileId, setProfileId] = useState<ProfileOptionId>('device')
  const [profile, setProfile] = useState<WallpaperProfile>(() =>
    resolveWallpaperProfile('device'),
  )
  const [previewSize, setPreviewSize] = useState({ width: 320, height: 693 })
  const [bgColor, setBgColor] = useState<string>(BG_PRESETS[1].value)
  const [busy, setBusy] = useState(false)
  const [showFestName, setShowFestName] = useState(false)
  const [showDayLabel, setShowDayLabel] = useState(false)
  const [scale, setScale] = useState(0.5)
  const [sourceHeight, setSourceHeight] = useState(600)

  const lineupOnDay = useMemo(
    () => lineupIdsOnDay(lineupIds, day),
    [lineupIds, day],
  )

  const festCaption = festivalShortLabel(festival.name, festival.shortName)

  const remeasureScale = useCallback(() => {
    const fit = fitRef.current
    const source = sourceRef.current
    if (!fit || !source) return
    const sh = source.scrollHeight
    const sw = MAIN_TIMETABLE_REF_WIDTH
    setSourceHeight(sh)
    const maxW = Math.max(40, fit.clientWidth)
    const maxH = Math.max(40, fit.clientHeight)
    setScale(computeWallpaperScale(sw, sh, maxW, maxH))
  }, [])

  const refreshProfile = useCallback(() => {
    const next = resolveWallpaperProfile(profileId)
    setProfile(next)
    const stage = stageRef.current
    if (!stage) return
    setPreviewSize(
      computeWallpaperPreviewSize(next, stage.clientWidth, stage.clientHeight),
    )
  }, [profileId])

  useLayoutEffect(() => {
    if (!open) return
    refreshProfile()
    const raf = requestAnimationFrame(refreshProfile)
    return () => cancelAnimationFrame(raf)
  }, [open, profileId, day.label, refreshProfile])

  useLayoutEffect(() => {
    if (!open) return
    remeasureScale()
    const raf = requestAnimationFrame(remeasureScale)
    return () => cancelAnimationFrame(raf)
  }, [
    open,
    previewSize,
    profile,
    day.label,
    lineupOnDay.length,
    showFestName,
    showDayLabel,
    remeasureScale,
  ])

  useEffect(() => {
    if (!open) return
    const raf = requestAnimationFrame(() => {
      const text = sourceRef.current?.textContent ?? ''
      preloadExportFonts(`${text}${festCaption}${day.label}`)
    })
    return () => cancelAnimationFrame(raf)
  }, [open, day.label, festCaption])

  const handleSave = async () => {
    if (!frameRef.current) return
    setBusy(true)
    try {
      const slug = day.label.replace(/[^\w가-힣]+/g, '-').slice(0, 32)
      const exportRatio = exportPixelRatioForFrame(profile, frameRef.current.clientWidth)
      await downloadElementPng(
        frameRef.current,
        `festrecipe-wallpaper-${profile.id}-${profile.width}x${profile.height}-${slug}.png`,
        exportRatio,
      )
    } finally {
      setBusy(false)
    }
  }

  if (festival.layoutKind !== 'timetable' || !day.slots.length) return null

  const scaledW = MAIN_TIMETABLE_REF_WIDTH * scale
  const scaledH = sourceHeight * scale

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent
        showCloseButton={false}
        className="wallpaper-studio max-w-none translate-x-0 translate-y-0 rounded-none ring-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">배경화면 편집</DialogTitle>
        <header className="wallpaper-studio__bar">
          <DialogClose
            render={
              <Button type="button" variant="outline" size="sm" className="shrink-0" />
            }
          >
            <XIcon data-icon="inline-start" />
            닫기
          </DialogClose>
          <span className="wallpaper-studio__title">{day.label} 배경화면</span>
          <Button
            type="button"
            size="sm"
            className="wallpaper-studio__save shrink-0"
            disabled={busy}
            onClick={handleSave}
          >
            {busy ? '저장 중…' : 'PNG 저장'}
          </Button>
        </header>

        <div ref={stageRef} className="wallpaper-studio__stage">
          <div
            className="wallpaper-studio__preview"
            style={{ width: previewSize.width, height: previewSize.height }}
          >
            <div
              ref={frameRef}
              className="wallpaper-studio__canvas"
              style={{ width: '100%', height: '100%', backgroundColor: bgColor }}
            >
              <div className="wallpaper-studio__stack">
                <div
                  ref={fitRef}
                  className="wallpaper-studio__fit"
                  style={{
                    top: `${profile.safeTopRatio * 100}%`,
                    bottom: `${profile.safeBottomRatio * 100}%`,
                  }}
                >
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
                            <p className="wallpaper-studio__day">{day.label}</p>
                          )}
                        </div>
                      )}
                      <div className="timetable-scroll">
                        <MobileTimetable
                          day={day}
                          stages={festival.stages}
                          artists={artists}
                          lineupIds={lineupOnDay}
                          exportMode
                          wallpaperCompact
                          onSlotClick={() => {}}
                          onToggleLineup={() => {}}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="wallpaper-studio__controls">
          <div className="wallpaper-studio__control">
            <span className="wallpaper-studio__label">해상도</span>
            <div className="wallpaper-studio__profiles">
              <button
                type="button"
                className={`wallpaper-studio__profile${profileId === 'device' ? ' is-active' : ''}`}
                onClick={() => setProfileId('device')}
              >
                이 기기
              </button>
              {WALLPAPER_PRESET_PROFILES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`wallpaper-studio__profile${profileId === p.id ? ' is-active' : ''}`}
                  onClick={() => setProfileId(p.id)}
                >
                  {p.shortLabel}
                </button>
              ))}
            </div>
            <p className="wallpaper-studio__profile-meta">{profile.label}</p>
          </div>

          <div className="wallpaper-studio__control">
            <span className="wallpaper-studio__label">배경색</span>
            <div className="wallpaper-studio__tones">
              {BG_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`wallpaper-studio__tone${bgColor === p.value ? ' is-active' : ''}`}
                  onClick={() => setBgColor(p.value)}
                >
                  <span
                    className="wallpaper-studio__tone-swatch"
                    style={{ backgroundColor: p.value }}
                  />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="wallpaper-studio__control">
            <span className="wallpaper-studio__label">캡션</span>
            <div className="wallpaper-studio__toggles">
              <button
                type="button"
                className={`wallpaper-studio__toggle${showFestName ? ' is-on' : ''}`}
                onClick={() => setShowFestName((v) => !v)}
              >
                페스티벌명
              </button>
              <button
                type="button"
                className={`wallpaper-studio__toggle${showDayLabel ? ' is-on' : ''}`}
                onClick={() => setShowDayLabel((v) => !v)}
              >
                날짜
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
