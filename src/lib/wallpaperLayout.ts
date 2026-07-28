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
 * 높이를 넘기지 않도록 min 상한을 두지 않고, 하루 전체가 들어가게 한다.
 */
export function computeWallpaperPxPerMin(
  slots: TimetableSlot[],
  gridAreaHeightPx: number,
  opts?: { max?: number },
): number {
  const max = opts?.max ?? 1.28
  const span = timetableMinutesSpan(slots)
  if (gridAreaHeightPx <= 0 || span <= 0) return 0.65
  const raw = gridAreaHeightPx / span
  return Math.min(max, Math.max(0.45, raw))
}
