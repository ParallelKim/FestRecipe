import type { FestivalStageStyle, TimetableSlot } from '../types'
import { resolveStageTheme } from './stageTheme'

export const TIMETABLE_WALLPAPER_PRESETS = [
  { id: '1080x2400', label: '1080 × 2400 (FHD)', width: 1080, height: 2400 },
  { id: '1290x2796', label: '1290 × 2796 (iPhone)', width: 1290, height: 2796 },
  { id: '1440x3200', label: '1440 × 3200 (QHD+)', width: 1440, height: 3200 },
  { id: '1080x2340', label: '1080 × 2340', width: 1080, height: 2340 },
] as const

export type TimetableWallpaperPresetId = (typeof TIMETABLE_WALLPAPER_PRESETS)[number]['id']

export interface TimetableWallpaperOptions {
  festivalName: string
  dayLabel: string
  stages: string[]
  slots: TimetableSlot[]
  highlightArtistIds: Set<string>
  artistNames: Record<string, string>
  stageStyles?: FestivalStageStyle[]
  width: number
  height: number
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let out = text
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1)
  }
  return `${out}…`
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/** 내 라인업이 강조된 일별 타임테이블 PNG (배경화면용) */
export function downloadTimetableWallpaper(opts: TimetableWallpaperOptions): boolean {
  const { stages, slots } = opts
  if (!stages.length || !slots.length) return false

  const canvas = document.createElement('canvas')
  canvas.width = opts.width
  canvas.height = opts.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return false

  const W = opts.width
  const H = opts.height
  const pad = Math.round(W * 0.045)
  const headerH = Math.round(H * 0.1)

  ctx.fillStyle = '#f4f6f5'
  ctx.fillRect(0, 0, W, H)

  const titleSize = Math.round(W * 0.036)
  ctx.fillStyle = '#111418'
  ctx.font = `800 ${titleSize}px system-ui, "Noto Sans KR", sans-serif`
  ctx.fillText(truncateText(ctx, opts.festivalName, W - pad * 2), pad, pad + titleSize)

  const subSize = Math.round(W * 0.026)
  ctx.font = `600 ${subSize}px system-ui, "Noto Sans KR", sans-serif`
  ctx.fillStyle = '#41454d'
  const onDay = new Set(slots.filter((s) => opts.highlightArtistIds.has(s.artistId)).map((s) => s.artistId))
  ctx.fillText(
    `${opts.dayLabel} · 내 라인업 ${onDay.size}팀`,
    pad,
    pad + titleSize + subSize * 1.15,
  )

  const gridX = pad
  const gridY = headerH
  const gridW = W - pad * 2
  const gridH = H - headerH - pad * 1.4
  const axisW = Math.round(gridW * 0.085)
  const colW = (gridW - axisW) / stages.length
  const stageHeaderH = Math.round(gridH * 0.07)

  const slotData = slots.map((s) => ({
    ...s,
    startMin: timeToMinutes(s.startTime),
    endMin: timeToMinutes(s.endTime),
  }))
  const startLimit = Math.min(...slotData.map((s) => s.startMin))
  const endLimit = Math.max(...slotData.map((s) => s.endMin))
  const totalMin = Math.max(endLimit - startLimit, 30)
  const bodyH = gridH - stageHeaderH
  const pxPerMin = bodyH / totalMin

  ctx.strokeStyle = '#111418'
  ctx.lineWidth = Math.max(2, W * 0.0025)
  ctx.strokeRect(gridX, gridY, gridW, gridH)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(gridX, gridY, axisW, gridH)

  stages.forEach((stage, i) => {
    const theme = resolveStageTheme(stage, opts.stageStyles)
    const x = gridX + axisW + i * colW

    ctx.fillStyle = theme.bg
    ctx.fillRect(x, gridY, colW, stageHeaderH)
    ctx.fillStyle = theme.fg
    ctx.font = `800 ${Math.round(W * 0.021)}px system-ui, "Noto Sans KR", sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(theme.shortLabel, x + colW / 2, gridY + stageHeaderH * 0.64)
    ctx.textAlign = 'left'

    ctx.fillStyle = theme.soft
    ctx.fillRect(x, gridY + stageHeaderH, colW, bodyH)

    if (i < stages.length - 1) {
      ctx.strokeStyle = 'rgba(17,20,24,0.12)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x + colW, gridY)
      ctx.lineTo(x + colW, gridY + gridH)
      ctx.stroke()
    }
  })

  const firstHour = Math.ceil(startLimit / 60)
  const lastHour = Math.floor(endLimit / 60)
  ctx.fillStyle = '#111418'
  ctx.font = `800 ${Math.round(W * 0.019)}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  for (let hour = firstHour; hour <= lastHour; hour++) {
    const y = gridY + stageHeaderH + (hour * 60 - startLimit) * pxPerMin
    if (y >= gridY + stageHeaderH + 4 && y <= gridY + gridH - 4) {
      ctx.fillText(String(hour), gridX + axisW / 2, y)
    }
  }
  ctx.textAlign = 'left'

  for (const slot of slotData) {
    const stageIdx = stages.indexOf(slot.stageName)
    if (stageIdx < 0) continue
    const theme = resolveStageTheme(slot.stageName, opts.stageStyles)
    const colX = gridX + axisW + stageIdx * colW
    const slotPad = colW * 0.04
    const x = colX + slotPad
    const w = colW - slotPad * 2
    const top = gridY + stageHeaderH + (slot.startMin - startLimit) * pxPerMin + 1
    const h = Math.max(slot.durationMinutes * pxPerMin - 2, W * 0.016)
    const highlighted = opts.highlightArtistIds.has(slot.artistId)

    ctx.fillStyle = highlighted ? theme.lineupBg : '#ffffff'
    ctx.strokeStyle = theme.accent
    ctx.lineWidth = highlighted ? Math.max(2, W * 0.003) : Math.max(1, W * 0.0018)
    roundRectPath(ctx, x, top, w, h, W * 0.007)
    ctx.fill()
    ctx.stroke()

    if (highlighted) {
      ctx.fillStyle = theme.accent
      ctx.fillRect(x, top + 1, Math.max(3, W * 0.005), h - 2)
    }

    const name = opts.artistNames[slot.artistId] || slot.artistId
    const fontSize = Math.max(Math.round(W * 0.019), Math.round(h * 0.32))
    ctx.fillStyle = '#111418'
    ctx.font = `800 ${fontSize}px system-ui, "Noto Sans KR", sans-serif`
    const textX = x + (highlighted ? W * 0.014 : W * 0.01)
    ctx.fillText(truncateText(ctx, name, w - W * 0.02), textX, top + fontSize * 1.05)

    if (h > fontSize * 1.85) {
      ctx.font = `600 ${Math.round(fontSize * 0.72)}px system-ui, sans-serif`
      ctx.fillStyle = 'rgba(17,20,24,0.55)'
      ctx.fillText(`${slot.startTime}–${slot.endTime}`, textX, top + fontSize * 1.95)
    }
  }

  ctx.fillStyle = 'rgba(17,20,24,0.35)'
  ctx.font = `${Math.round(W * 0.017)}px system-ui, sans-serif`
  ctx.fillText('FestRecipe', pad, H - pad * 0.5)

  const slug = opts.dayLabel.replace(/[^\w가-힣]+/g, '-').slice(0, 32)
  const link = document.createElement('a')
  link.download = `festrecipe-timetable-${slug}-${opts.width}x${opts.height}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
  return true
}

export function resolveWallpaperPixelSize(
  presetId: TimetableWallpaperPresetId,
  scalePercent: number,
): { width: number; height: number } {
  const preset = TIMETABLE_WALLPAPER_PRESETS.find((p) => p.id === presetId) ?? TIMETABLE_WALLPAPER_PRESETS[0]
  const scale = Math.min(200, Math.max(50, scalePercent)) / 100
  return {
    width: Math.round(preset.width * scale),
    height: Math.round(preset.height * scale),
  }
}
