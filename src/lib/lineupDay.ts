import type { DayLineup } from '../types'

/** 일자 라인업에 등장하는 아티스트 id */
export function artistIdsOnDay(day: DayLineup | undefined): Set<string> {
  const ids = new Set<string>()
  if (!day) return ids
  for (const id of day.artists || []) ids.add(id)
  for (const slot of day.slots || []) ids.add(slot.artistId)
  return ids
}

export function filterMyLineupForDay(myLineupIds: string[], day: DayLineup | undefined): string[] {
  const onDay = artistIdsOnDay(day)
  if (onDay.size === 0) return [...myLineupIds]
  return myLineupIds.filter((id) => onDay.has(id))
}
