// ─────────────────────────────────────────────────────
//  FestRecipe — Core TypeScript Types
// ─────────────────────────────────────────────────────

export type SignatureColor = 'coral' | 'forest' | 'cream' | 'dark'
export type FestivalStatus = 'upcoming' | 'ongoing' | 'past'
export type LineupStage = 'stage1_all' | 'stage2_daily' | 'stage3_timetable'
export type SongType = 'released' | 'unreleased' | 'cover'
type AlbumType = 'single' | 'ep' | 'lp'

export interface Artist {
  id: string
  /**
   * UI 공식 표기명 (공식 TT 등 출처 기준 사람 큐레이션).
   * 가이드: docs/ARTIST_DISPLAY_NAMES.md
   */
  name: string
  /** 로마자/영문 표기 (검색·YTM 매칭) */
  englishName?: string
  /** 한글 통용명 참고 (선택) */
  koreanName?: string
  /** 수집 당시 YTM 아티스트명 원문 — 검수 참고용 */
  ytmName?: string
  country?: string // KR, US, UK, JP etc (외국 아티스트만)
  imageUrl?: string
  genres?: string[]
  aliases?: string[]
  ytmBrowseId?: string
}

/** 인지도 티어에 따른 대표곡 플레이리스트 */
export type RecognitionTier = 'high' | 'mid' | 'low'

export interface ArtistRecognition {
  tier: RecognitionTier
  songCount: number
  latestSlotMinutes?: number | null
  latestSlotLabel?: string | null
  festivalId?: string | null
  rank?: number | null
  reason: 'timetable_lateness' | 'no_timetable_default' | string
}

export interface PlaylistTrack {
  videoId: string
  songTitle: string
  title?: string
  artists?: string[]
  albumTitle?: string
  year?: string | number | null
  duration?: string
  durationSeconds?: number | null
  thumbnailUrl?: string
  youtubeUrl: string
  youtubeMusicUrl?: string
  source?: string
}

export interface ArtistPlaylist {
  artistId: string
  artistName?: string
  englishName?: string
  collectedAt: string
  source: 'youtube_music'
  selection: string
  recognition: ArtistRecognition
  /** 아티스트 단독 듣기·목록에 노출되는 곡 수 (YTM 인기순, 보통 ≥10) */
  songCount: number
  /** 요일·페스티벌·나만의 번들에 넣을 곡 수 (티어 3~5) */
  targetSongCount: number
  tracks: PlaylistTrack[]
  /** YouTube watch_videos 에 넘길 재생목록 표시명 */
  playlistTitle?: string | null
  youtubePlaylistUrl?: string | null
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

interface TimetableSlot {
  artistId: string
  stageName: string
  startTime: string // e.g. "12:00"
  endTime: string   // e.g. "12:40"
  durationMinutes: number
}

/** 타임테이블 스테이지 색 — 페스티벌 JSON `stageStyles` 로 정의 */
export interface FestivalStageStyle {
  /** `slots[].stageName` · `day.stages[]` 와 동일 */
  stageName: string
  shortLabel?: string
  bg: string
  fg: string
  accent: string
  /** 무대 열 배경 */
  soft: string
  /** 내 라인업 담김 슬롯 연한 배경 — 생략 시 `soft` */
  lineupBg?: string
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
  /**
   * 연도·개최지 없이 통하는 짧은 이름 (배경화면 캡션 등).
   * 예: "PENTAPORT" — 영문 대문자 권장
   */
  shortName?: string
  startDate: string
  endDate: string
  location: string
  signatureColor: SignatureColor
  status: FestivalStatus
  lineupStage: LineupStage
  /** 히어로·카드용 짧은 매력 문장 (스폰서/스테이지명 비권장) */
  tagline?: string
  /** SEO·상세용 설명. 스테이지 스폰서명은 타임테이블에만 두는 것을 권장 */
  description: string
  websiteUrl?: string
  /** 공식 로고 (라이트 배경용) */
  logoUrl?: string
  /** 다크/컬러 히어로용 밝은 로고 */
  logoLightUrl?: string
  /** 메인 라인업 포스터 (상세·대표 비주얼) */
  posterUrl?: string
  /** 지도 딥링크. 없으면 location 검색으로 생성 */
  mapUrl?: string
  /** 타임테이블 스테이지별 색 (페스티벌마다 다르게 지정) */
  stageStyles?: FestivalStageStyle[]
  /** 스테이지 없는 라인업(칩·카드) 내 라인업 하이라이트 배경 */
  lineupHighlightColor?: string
  allArtists: string[] // 1단계(all) 요일미구분 전체 라인업
  lineup: DayLineup[]
}

