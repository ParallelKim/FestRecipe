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

export type MobileSignatureColor = 'cream' | 'forest' | 'coral' | 'dark'

export interface MobileFestivalView {
  id: string
  name: string
  shortName?: string
  startDate: string
  endDate: string
  location: string
  signatureColor: MobileSignatureColor
  tagline?: string
  logoUrl?: string
  posterUrl?: string
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
  /** composedOf 멤버 표기 (예: "블랙홀 · 방수미"). TT `name`과 별도 Feat 라인 */
  featLabel?: string
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
  /**
   * 단독 듣기 URL.
   * 있으면 YTM Songs 기명 재생목록(`youtube.com/playlist?list=…`),
   * 없으면 호출측에서 watch_videos 폴백.
   */
  listenUrl?: string | null
}

export interface MobileBundleNotice {
  title: string
  body: string
  warn: boolean
}
