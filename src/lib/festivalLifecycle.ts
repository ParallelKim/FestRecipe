import type { Festival, FestivalLifecycle, FestivalStatus } from '../types'

export function todayIso(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T12:00:00`)
  const to = Date.parse(`${toIso}T12:00:00`)
  return Math.round((to - from) / 86_400_000)
}

/** 일정 SSOT — JSON `status`(티켓 단계)와 무관 */
export function festivalLifecycle(
  festival: Pick<Festival, 'startDate' | 'endDate'>,
  today = todayIso(),
): FestivalLifecycle {
  if (today < festival.startDate) return 'upcoming'
  if (today <= festival.endDate) return 'ongoing'
  return 'past'
}

export function isFestivalPast(
  festival: Pick<Festival, 'startDate' | 'endDate'>,
  today = todayIso(),
): boolean {
  return festivalLifecycle(festival, today) === 'past'
}

export function isFestivalActive(
  festival: Pick<Festival, 'startDate' | 'endDate'>,
  today = todayIso(),
): boolean {
  return festivalLifecycle(festival, today) !== 'past'
}

/** 활성(예정·진행) 우선, 그다음 시작일 오름 / 지난 것은 종료일 내림 */
export function sortFestivalsForList(
  festivals: Festival[],
  today = todayIso(),
): Festival[] {
  return [...festivals].sort((a, b) => {
    const aActive = isFestivalActive(a, today)
    const bActive = isFestivalActive(b, today)
    if (aActive !== bActive) return aActive ? -1 : 1

    const aOngoing = festivalLifecycle(a, today) === 'ongoing'
    const bOngoing = festivalLifecycle(b, today) === 'ongoing'
    if (aOngoing !== bOngoing) return aOngoing ? -1 : 1

    if (aActive) return a.startDate.localeCompare(b.startDate)
    return b.endDate.localeCompare(a.endDate)
  })
}

export function sortPastFestivals(
  festivals: Festival[],
  today = todayIso(),
): Festival[] {
  return festivals
    .filter((f) => isFestivalPast(f, today))
    .sort((a, b) => b.endDate.localeCompare(a.endDate))
}

export function sortActiveFestivals(
  festivals: Festival[],
  today = todayIso(),
): Festival[] {
  return sortFestivalsForList(
    festivals.filter((f) => isFestivalActive(f, today)),
    today,
  )
}

/** D-day / DAY n — 지난 축제에는 쓰지 않음 */
export function festivalDdayLabel(
  festival: Pick<Festival, 'startDate' | 'endDate'>,
  today = todayIso(),
): string | null {
  const life = festivalLifecycle(festival, today)
  if (life === 'past') return null
  if (life === 'upcoming') {
    const n = daysBetween(today, festival.startDate)
    return n === 0 ? 'D-DAY' : `D-${n}`
  }
  const day = daysBetween(festival.startDate, today) + 1
  return `DAY ${day}`
}

const STATUS_LABELS: Record<FestivalStatus, string> = {
  super_earlybird: '슈퍼얼리버드',
  earlybird: '얼리버드',
  general: '일반예매',
  closed: '예매 종료',
}

export function festivalStatusLabel(status: FestivalStatus): string {
  return STATUS_LABELS[status] ?? status
}

export interface FestivalEditionNeighbor {
  id: string
  editionYear: number
  name: string
  shortName?: string
}

/** 같은 seriesId의 이전·다음 연도 에디션 */
export function findEditionNeighbors(
  festivals: Festival[],
  current: Pick<Festival, 'id' | 'seriesId' | 'editionYear'>,
): {
  previous: FestivalEditionNeighbor | null
  next: FestivalEditionNeighbor | null
} {
  const series = festivals
    .filter((f) => f.seriesId === current.seriesId && f.id !== current.id)
    .sort((a, b) => a.editionYear - b.editionYear)

  let previous: FestivalEditionNeighbor | null = null
  let next: FestivalEditionNeighbor | null = null

  for (const f of series) {
    if (f.editionYear < current.editionYear) {
      previous = {
        id: f.id,
        editionYear: f.editionYear,
        name: f.name,
        shortName: f.shortName,
      }
    } else if (f.editionYear > current.editionYear && !next) {
      next = {
        id: f.id,
        editionYear: f.editionYear,
        name: f.name,
        shortName: f.shortName,
      }
    }
  }

  return { previous, next }
}
