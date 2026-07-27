import type { TimetableSlot } from '../types'

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * 각 스테이지의 마지막 슬롯(가장 늦은 시작) 아티스트를 헤드라이너로 본다.
 */
export function headlinerArtistIds(slots: TimetableSlot[] | undefined): Set<string> {
  if (!slots?.length) return new Set()

  const latestByStage = new Map<string, { artistId: string; startMin: number }>()
  for (const slot of slots) {
    const startMin = timeToMinutes(slot.startTime)
    const prev = latestByStage.get(slot.stageName)
    if (!prev || startMin > prev.startMin) {
      latestByStage.set(slot.stageName, { artistId: slot.artistId, startMin })
    }
  }

  return new Set([...latestByStage.values()].map((v) => v.artistId))
}
