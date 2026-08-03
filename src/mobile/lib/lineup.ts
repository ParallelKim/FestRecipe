import type { MobileDayView } from '../view/types'

export function lineupIdsOnDay(allIds: string[], day?: MobileDayView): string[] {
  if (!day) return []
  const onDay = new Set(day.artistIds)
  return allIds.filter((id) => onDay.has(id))
}

export function removeDayFromLineup(allIds: string[], day?: MobileDayView): string[] {
  if (!day) return allIds
  const onDay = new Set(day.artistIds)
  return allIds.filter((id) => !onDay.has(id))
}

export function festivalShortLabel(name: string, shortName?: string): string {
  const short = shortName?.trim()
  if (short) return short.toUpperCase()
  return name
}
