import type {
  MobileArtistView,
  MobileDayView,
  MobileFestivalView,
  MobileLayoutKind,
  MobileSlotView,
  MobileStageTheme,
} from '../view/types'

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback
}

function layoutKindFromRaw(lineupStage: unknown): MobileLayoutKind {
  if (lineupStage === 'stage3_timetable') return 'timetable'
  if (lineupStage === 'stage2_daily') return 'daily'
  return 'all'
}

function mapStages(raw: Record<string, unknown>): MobileStageTheme[] {
  const styles = raw.stageStyles
  if (!Array.isArray(styles)) return []

  return styles
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const s = item as Record<string, unknown>
      const label = asString(s.stageName)
      if (!label) return null
      return {
        stageId: label,
        label,
        shortLabel: asString(s.shortLabel, label),
        bg: asString(s.bg, '#f3f4f6'),
        fg: asString(s.fg, '#141414'),
        accent: asString(s.accent, '#141414'),
        lineupBg: asString(s.lineupBg, '#f0f0f0'),
      }
    })
    .filter((s): s is MobileStageTheme => s !== null)
}

function mapDay(raw: Record<string, unknown>): MobileDayView | null {
  const date = asString(raw.date)
  if (!date) return null

  const stageIds = Array.isArray(raw.stages)
    ? raw.stages.map((s) => asString(s)).filter(Boolean)
    : []

  const artistIds = Array.isArray(raw.artists)
    ? raw.artists.map((a) => asString(a)).filter(Boolean)
    : []

  const slots: MobileSlotView[] = []
  if (Array.isArray(raw.slots)) {
    for (const item of raw.slots) {
      if (!item || typeof item !== 'object') continue
      const slot = item as Record<string, unknown>
      const artistId = asString(slot.artistId)
      const stageId = asString(slot.stageName)
      if (!artistId || !stageId) continue
      slots.push({
        artistId,
        stageId,
        startTime: asString(slot.startTime),
        endTime: asString(slot.endTime),
        durationMinutes: asNumber(slot.durationMinutes, 30),
      })
    }
  }

  const idsFromSlots = slots.map((s) => s.artistId)
  const mergedArtistIds =
    artistIds.length > 0 ? artistIds : [...new Set(idsFromSlots)]

  return {
    id: date,
    label: asString(raw.dayLabel, date),
    stageIds,
    slots,
    artistIds: mergedArtistIds,
  }
}

export function mapFestivalView(raw: Record<string, unknown>): MobileFestivalView | null {
  const id = asString(raw.id)
  if (!id) return null

  const days: MobileDayView[] = []
  if (Array.isArray(raw.lineup)) {
    for (const item of raw.lineup) {
      if (!item || typeof item !== 'object') continue
      const day = mapDay(item as Record<string, unknown>)
      if (day) days.push(day)
    }
  }

  const allArtistIds = Array.isArray(raw.allArtists)
    ? raw.allArtists.map((a) => asString(a)).filter(Boolean)
    : []

  return {
    id,
    name: asString(raw.name, id),
    shortName: asString(raw.shortName) || undefined,
    startDate: asString(raw.startDate),
    endDate: asString(raw.endDate),
    location: asString(raw.location),
    logoUrl: asString(raw.logoUrl) || undefined,
    mapUrl: asString(raw.mapUrl) || undefined,
    websiteUrl: asString(raw.websiteUrl) || undefined,
    description: asString(raw.description) || undefined,
    layoutKind: layoutKindFromRaw(raw.lineupStage),
    days,
    allArtistIds,
    stages: mapStages(raw),
  }
}

export function mapArtistViews(rawList: Record<string, unknown>[]): MobileArtistView[] {
  return rawList
    .map((raw) => {
      const id = asString(raw.id)
      if (!id) return null
      return {
        id,
        displayName: asString(raw.name, id),
      }
    })
    .filter((a): a is MobileArtistView => a !== null)
}
