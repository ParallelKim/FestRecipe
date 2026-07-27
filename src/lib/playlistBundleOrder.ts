/**
 * 프론트에서 익명 번들을 조합할 때 아티스트 순서.
 * 타임테이블 슬롯 종료 시각 기준(먼저 끝나는 팀이 앞). 슬롯 정보가 없으면 맨 뒤(원 순서 유지).
 */

import type { DayLineup, TimetableSlot } from '../types'

function timeToMinutes(time: string | undefined): number | null {
  if (!time) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

function slotSortKey(slot: TimetableSlot): number | null {
  return timeToMinutes(slot.endTime) ?? timeToMinutes(slot.startTime)
}

/** 요일 번들: 해당 일 slots 기준 종료 시각 오름차순 */
export function orderArtistIdsForDayBundle(
  artistIds: string[],
  slots: TimetableSlot[] | undefined,
): string[] {
  if (!slots?.length) return [...artistIds]

  const bestEnd = new Map<string, number>()
  for (const slot of slots) {
    const key = slotSortKey(slot)
    if (key == null || !slot.artistId) continue
    const prev = bestEnd.get(slot.artistId)
    if (prev === undefined || key < prev) bestEnd.set(slot.artistId, key)
  }

  return partitionSort(artistIds, bestEnd)
}

/**
 * 페스티벌 전체 번들: 일자 순 → 그날 종료 시각 순.
 * (다른 날짜는 dayIndex로 구분; 종료 시각만으로는 날짜를 구분할 수 없음)
 */
export function orderArtistIdsForFestivalBundle(
  artistIds: string[],
  lineup: DayLineup[] | undefined,
): string[] {
  if (!lineup?.length) return [...artistIds]

  const bestKey = new Map<string, number>()
  lineup.forEach((day, dayIndex) => {
    for (const slot of day.slots || []) {
      const end = slotSortKey(slot)
      if (end == null || !slot.artistId) continue
      const composite = dayIndex * 24 * 60 + end
      const prev = bestKey.get(slot.artistId)
      if (prev === undefined || composite < prev) bestKey.set(slot.artistId, composite)
    }
  })

  return partitionSort(artistIds, bestKey)
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
