import type { MobileDayView, MobileSlotView } from '../view/types'

function timeToMinutes(time: string | undefined): number | null {
  if (!time) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

function slotSortKey(slot: MobileSlotView): number | null {
  return timeToMinutes(slot.endTime) ?? timeToMinutes(slot.startTime)
}

function partitionSort(artistIds: string[], sortKey: Map<string, number>): string[] {
  const ranked: { id: string; key: number; idx: number }[] = []
  const tail: { id: string; idx: number }[] = []

  artistIds.forEach((id, idx) => {
    const key = sortKey.get(id)
    if (key !== undefined) ranked.push({ id, key, idx })
    else tail.push({ id, idx })
  })

  ranked.sort((a, b) => a.key - b.key || a.idx - b.idx)
  tail.sort((a, b) => a.idx - b.idx)
  return [...ranked.map((r) => r.id), ...tail.map((t) => t.id)]
}

export function orderArtistIdsForDay(slots: MobileSlotView[], artistIds: string[]): string[] {
  if (!slots.length) return [...artistIds]

  const bestEnd = new Map<string, number>()
  for (const slot of slots) {
    const key = slotSortKey(slot)
    if (key == null) continue
    const prev = bestEnd.get(slot.artistId)
    if (prev === undefined || key < prev) bestEnd.set(slot.artistId, key)
  }

  return partitionSort(artistIds, bestEnd)
}

export function orderArtistIdsForFestival(days: MobileDayView[], artistIds: string[]): string[] {
  if (!days.length) return [...artistIds]

  const bestKey = new Map<string, number>()
  days.forEach((day, dayIndex) => {
    for (const slot of day.slots) {
      const end = slotSortKey(slot)
      if (end == null) continue
      const composite = dayIndex * 24 * 60 + end
      const prev = bestKey.get(slot.artistId)
      if (prev === undefined || composite < prev) bestKey.set(slot.artistId, composite)
    }
  })

  return partitionSort(artistIds, bestKey)
}
