import type { TimetableSlot } from '../types'

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function timetableMinutesSpan(slots: TimetableSlot[]): number {
  if (!slots.length) return 60
  const starts = slots.map((s) => timeToMinutes(s.startTime))
  const ends = slots.map((s) => timeToMinutes(s.endTime))
  const start = Math.min(...starts)
  const end = Math.max(...ends)
  return Math.max(end - start, 30)
}

/**
 * 배경화면 프레임 안에서 그리드가 차지할 높이에 맞춘 px/분.
 */
export function computeWallpaperPxPerMin(
  slots: TimetableSlot[],
  gridAreaHeightPx: number,
  opts?: { min?: number; max?: number },
): number {
  const min = opts?.min ?? 0.9
  const max = opts?.max ?? 2.4
  const span = timetableMinutesSpan(slots)
  const raw = gridAreaHeightPx / span
  return Math.min(max, Math.max(min, raw))
}
