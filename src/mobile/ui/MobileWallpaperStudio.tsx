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
import { ButtonGroup } from '@/components/ui/button-group'
import { Toggle } from '@/components/ui/toggle'
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
        className="flex h-[100dvh] max-h-[100dvh] max-w-none flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">배경화면 편집</DialogTitle>

        <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
          <DialogClose
            render={
              <Button type="button" variant="outline" size="sm" className="shrink-0" />
            }
          >
            <XIcon data-icon="inline-start" />
            닫기
          </DialogClose>
          <span className="min-w-0 flex-1 truncate text-center text-sm font-bold">
            {day.label} 배경화면
          </span>
          <Button
            type="button"
            size="sm"
            className="shrink-0"
            disabled={busy}
            onClick={handleSave}
          >
            {busy ? '저장 중…' : 'PNG 저장'}
          </Button>
        </header>

        <div
          ref={stageRef}
          className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-muted/30 px-4 py-5"
        >
          <div
            className="relative overflow-hidden rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
            style={{ width: previewSize.width, height: previewSize.height }}
          >
            <div
              ref={frameRef}
              className="size-full"
              style={{ backgroundColor: bgColor }}
            >
              <div className="relative size-full box-border">
                <div
                  ref={fitRef}
                  className="absolute left-1.5 right-1.5 flex min-h-0 items-center justify-center overflow-hidden"
                  style={{
                    top: `${profile.safeTopRatio * 100}%`,
                    bottom: `${profile.safeBottomRatio * 100}%`,
                  }}
                >
                  <div
                    className="relative shrink-0"
                    style={{ width: scaledW, height: scaledH }}
                  >
                    <div
                      ref={sourceRef}
                      className="absolute top-0 left-0 origin-top-left select-none pointer-events-none"
                      style={{
                        width: MAIN_TIMETABLE_REF_WIDTH,
                        transform: `scale(${scale})`,
                      }}
                    >
                      {(showFestName || showDayLabel) && (
                        <div className="mb-2 shrink-0 text-center leading-tight">
                          {showFestName && (
                            <p className="m-0 text-xs font-semibold tracking-wide text-muted-foreground opacity-90">
                              {festCaption}
                            </p>
                          )}
                          {showDayLabel && (
                            <p className="mt-0.5 mb-0 text-[13px] font-bold tracking-tight">
                              {day.label}
                            </p>
                          )}
                        </div>
                      )}
                      <div className="m-0 overflow-visible p-0">
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

        <div className="shrink-0 space-y-4 border-t border-border bg-background px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">해상도</span>
            <ButtonGroup className="flex w-full flex-wrap gap-1">
              <Button
                type="button"
                size="sm"
                variant={profileId === 'device' ? 'default' : 'outline'}
                className="min-w-0 flex-1"
                onClick={() => setProfileId('device')}
              >
                이 기기
              </Button>
              {WALLPAPER_PRESET_PROFILES.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  size="sm"
                  variant={profileId === p.id ? 'default' : 'outline'}
                  className="min-w-0 flex-1"
                  onClick={() => setProfileId(p.id)}
                >
                  {p.shortLabel}
                </Button>
              ))}
            </ButtonGroup>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {profile.label}
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">배경색</span>
            <div className="flex flex-wrap gap-2">
              {BG_PRESETS.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  size="sm"
                  variant={bgColor === p.value ? 'default' : 'outline'}
                  className="gap-2"
                  onClick={() => setBgColor(p.value)}
                >
                  <span
                    className="size-4 shrink-0 rounded-full border border-border/60"
                    style={{ backgroundColor: p.value }}
                    aria-hidden="true"
                  />
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">캡션</span>
            <div className="flex gap-2">
              <Toggle
                pressed={showFestName}
                onPressedChange={setShowFestName}
                variant="outline"
                className="min-h-9 flex-1 text-xs font-semibold"
              >
                페스티벌명
              </Toggle>
              <Toggle
                pressed={showDayLabel}
                onPressedChange={setShowDayLabel}
                variant="outline"
                className="min-h-9 flex-1 text-xs font-semibold"
              >
                날짜
              </Toggle>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
