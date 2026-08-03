/** `/m` UI 전용 뷰 모델 — `src/types` Festival·Artist와 분리 */

export type MobileLayoutKind = 'timetable' | 'daily' | 'all'

export type RecognitionTier = 'high' | 'mid' | 'low'

export interface MobileStageTheme {
  stageId: string
  label: string
  shortLabel: string
  bg: string
  fg: string
  accent: string
  lineupBg: string
}

export interface MobileSlotView {
  artistId: string
  stageId: string
  startTime: string
  endTime: string
  durationMinutes: number
}

export interface MobileDayView {
  id: string
  label: string
  stageIds: string[]
  slots: MobileSlotView[]
  artistIds: string[]
}

export interface MobileFestivalView {
  id: string
  name: string
  shortName?: string
  startDate: string
  endDate: string
  location: string
  logoUrl?: string
  mapUrl?: string
  websiteUrl?: string
  description?: string
  layoutKind: MobileLayoutKind
  days: MobileDayView[]
  allArtistIds: string[]
  stages: MobileStageTheme[]
}

export interface MobileArtistView {
  id: string
  displayName: string
}

export interface MobileTrackView {
  videoId: string
  title: string
}

export interface MobilePlaylistView {
  artistId: string
  tracks: MobileTrackView[]
  targetSongCount: number
  tier: RecognitionTier
}

export interface MobileBundleNotice {
  title: string
  body: string
  warn: boolean
}
