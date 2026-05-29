// ─────────────────────────────────────────────────────
//  FestRecipe — Core TypeScript Types
// ─────────────────────────────────────────────────────

export type SignatureColor = 'coral' | 'forest' | 'cream' | 'dark'
export type FestivalStatus = 'upcoming' | 'ongoing' | 'past'
export type LineupStage = 'stage1_all' | 'stage2_daily' | 'stage3_timetable'
export type SongType = 'released' | 'unreleased' | 'cover'
export type AlbumType = 'single' | 'ep' | 'lp'

export interface Artist {
  id: string
  name: string
  englishName?: string
  country?: string // KR, US, UK, JP etc (외국 아티스트만)
  imageUrl?: string
  genres?: string[]
}

export interface AlbumInfo {
  albumType: AlbumType
  albumName: string
  trackNumber?: number
}

// ─────────────────────────────────────────────────────
//  지난 공연 링크 (실제 존재하는 영상 링크 모음)
// ─────────────────────────────────────────────────────
export interface PastConcertLinks {
  concertLabel: string       // e.g. "2025 BML" — 어느 공연/페스티벌인지
  youtubeFullcamUrl?: string // 풀캠 타임스탬프 딥링크 (&t=XXs) — 해당 곡 시작 지점
  youtubeLiveClipUrl?: string// 팬 라이브 클립 개별 영상
}

// ─────────────────────────────────────────────────────
//  예상 셋리스트 곡 (통계 기반 — 확률 수치 없음)
// ─────────────────────────────────────────────────────
export interface SetlistSong {
  songTitle: string
  songType: SongType
  albumInfo?: AlbumInfo
  originalArtist?: string   // cover일 때 원곡자
  appearanceCount: number   // 최근 N회 중 등장 횟수
  totalConcertCount: number // 조사한 최근 총 공연 횟수
  youtubeOfficialUrl?: string  // 공식 영상 / 뮤비 (스트리밍 링크)
  pastConcertLinks?: PastConcertLinks[] // 지난 공연 퍼포먼스 링크 목록 (최신순)
}

export interface TimetableSlot {
  artistId: string
  stageName: string
  startTime: string // e.g. "12:00"
  endTime: string   // e.g. "12:40"
  durationMinutes: number
}

export interface DayLineup {
  date: string         // ISO date e.g. "2026-06-12"
  dayLabel: string     // e.g. "6.12 FRI (전야제)"
  stages?: string[]    // 3단계(timetable)에서 보여줄 무대 목록 (e.g. ["Mint Stage", "Breeze Stage"])
  artists: string[]    // 2단계(daily) 라인업
  slots?: TimetableSlot[] // 3단계(timetable) 시간표 목록
}

export interface Festival {
  id: string
  name: string
  startDate: string
  endDate: string
  location: string
  signatureColor: SignatureColor
  status: FestivalStatus
  lineupStage: LineupStage
  description: string
  websiteUrl?: string
  allArtists: string[] // 1단계(all) 요일미구분 전체 라인업
  lineup: DayLineup[]
}

// UI 전용 타입
export interface FestivalsData {
  festivals: Festival[]
  artists: Artist[]
}
