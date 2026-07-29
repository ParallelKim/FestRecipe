/**
 * 요일/페스티벌/나만의 익명 재생목록(watch_videos) 번들 로직.
 *
 * 아티스트 단독 듣기는 playlist JSON의 전체 tracks(보통 YTM 10~20곡).
 * 번들은 targetSongCount(티어)만큼만 각 아티스트에서 가져온다.
 *
 * 아티스트 인지도 티어 기본 곡 수: high=5 / mid=4 / low=3.
 * 합계가 50을 넘으면 2/3/4 → 1/2/3 으로 다운그레이드하고,
 * 그래도 넘치면 라운드로빈으로 50곡까지 채운다.
 *
 * 아티스트 순서는 프론트 조합 시 `playlistBundleOrder.ts` (슬롯 종료 시각).
 * collector/JSON 빌드 순서와 무관하며, 슬롯이 없으면 순서를 알 수 없어 뒤로 둔다.
 */

import type { ArtistPlaylist, RecognitionTier } from '../types'
import { WATCH_VIDEOS_MAX, uniqueVideoIds } from './youtubePlaylist'

export type BundleSongScheme = 'full' | 'reduced' | 'minimal'

/** high / mid / low 순 */
export type TierSongBudget = Record<RecognitionTier, number>

export const BUNDLE_SONG_SCHEMES: Record<BundleSongScheme, TierSongBudget> = {
  full: { high: 5, mid: 4, low: 3 },
  reduced: { high: 4, mid: 3, low: 2 },
  minimal: { high: 3, mid: 2, low: 1 },
}

const SCHEME_ORDER: BundleSongScheme[] = ['full', 'reduced', 'minimal']

export interface BundleArtistInput {
  artistId: string
  tier: RecognitionTier
  videoIds: string[]
}

export interface BundledAnonymousPlaylist {
  videoIds: string[]
  scheme: BundleSongScheme
  budget: TierSongBudget
  artistCount: number
  includedArtistCount: number
  /** 다운그레이드 전(풀 티어) 추정 곡 수 */
  fullTrackCount: number
  selectedCount: number
  /** full이 아닌 예산으로 줄였음 */
  downgraded: boolean
  /** minimal로도 50 초과 → 일부 누락 */
  truncated: boolean
  /** 아티스트당 1~3곡 수준이라 얇음 */
  thinCoverage: boolean
}

function normalizeTier(tier: RecognitionTier | string | undefined): RecognitionTier {
  if (tier === 'high' || tier === 'mid' || tier === 'low') return tier
  return 'low'
}

export function artistInputsFromPlaylists(
  playlists: Array<ArtistPlaylist | null | undefined>,
): BundleArtistInput[] {
  const out: BundleArtistInput[] = []
  for (const pl of playlists) {
    if (!pl?.artistId) continue
    const bundleLimit =
      pl.targetSongCount > 0
        ? pl.targetSongCount
        : pl.recognition?.songCount ?? pl.tracks?.length ?? 0
    const videoIds = uniqueVideoIds(
      (pl.tracks || []).slice(0, bundleLimit).map((t) => t.videoId),
    )
    if (videoIds.length === 0) continue
    out.push({
      artistId: pl.artistId,
      tier: normalizeTier(pl.recognition?.tier),
      videoIds,
    })
  }
  return out
}

function countWithBudget(artists: BundleArtistInput[], budget: TierSongBudget): number {
  const seen = new Set<string>()
  for (const a of artists) {
    const n = Math.min(budget[a.tier], a.videoIds.length)
    for (let i = 0; i < n; i++) seen.add(a.videoIds[i])
  }
  return seen.size
}

/** 티어 예산 안에서 앞에서부터 곡을 모은다 (중복 제거). */
function collectSequential(
  artists: BundleArtistInput[],
  budget: TierSongBudget,
  max = WATCH_VIDEOS_MAX,
): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const a of artists) {
    const n = Math.min(budget[a.tier], a.videoIds.length)
    for (let i = 0; i < n; i++) {
      const id = a.videoIds[i]
      if (seen.has(id)) continue
      seen.add(id)
      out.push(id)
      if (out.length >= max) return out
    }
  }
  return out
}

/**
 * 예산을 넘길 때 공정하게: 라운드 0부터 아티스트 순회하며
 * 각자 budget[tier] 한도 안에서 한 곡씩 추가.
 */
function collectRoundRobin(
  artists: BundleArtistInput[],
  budget: TierSongBudget,
  max = WATCH_VIDEOS_MAX,
): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const maxRounds = Math.max(...Object.values(budget), 1)

  for (let round = 0; round < maxRounds; round++) {
    for (const a of artists) {
      if (out.length >= max) return out
      if (round >= budget[a.tier]) continue
      if (round >= a.videoIds.length) continue
      const id = a.videoIds[round]
      if (seen.has(id)) continue
      seen.add(id)
      out.push(id)
    }
  }
  return out
}

export function buildBundledAnonymousPlaylist(
  artists: BundleArtistInput[],
  max = WATCH_VIDEOS_MAX,
): BundledAnonymousPlaylist | null {
  if (artists.length === 0) return null

  const fullTrackCount = countWithBudget(artists, BUNDLE_SONG_SCHEMES.full)
  let chosen: BundleSongScheme = 'minimal'
  let fits = false

  for (const scheme of SCHEME_ORDER) {
    const count = countWithBudget(artists, BUNDLE_SONG_SCHEMES[scheme])
    if (count <= max) {
      chosen = scheme
      fits = true
      break
    }
  }

  const budget = BUNDLE_SONG_SCHEMES[chosen]
  const videoIds = fits
    ? collectSequential(artists, budget, max)
    : collectRoundRobin(artists, budget, max)

  if (videoIds.length === 0) return null

  const included = new Set<string>()
  for (const a of artists) {
    if (a.videoIds.some((id) => videoIds.includes(id))) included.add(a.artistId)
  }

  const downgraded = chosen !== 'full'
  const truncated = !fits || fullTrackCount > videoIds.length
  const thinCoverage = chosen === 'minimal' || budget.low <= 1

  return {
    videoIds,
    scheme: chosen,
    budget,
    artistCount: artists.length,
    includedArtistCount: included.size,
    fullTrackCount,
    selectedCount: videoIds.length,
    downgraded,
    truncated: truncated && fullTrackCount > max,
    thinCoverage,
  }
}

export function bundleNoticeCopy(bundle: BundledAnonymousPlaylist): {
  title: string
  body: string
} {
  const { high, mid, low } = bundle.budget
  const tierLabel = `헤드라이너급 ${high}곡 · 메인 ${mid}곡 · 그 외 ${low}곡`

  if (bundle.truncated && bundle.thinCoverage) {
    return {
      title: '일부 대표곡만 열려요',
      body:
        `YouTube 임시 재생목록은 최대 ${WATCH_VIDEOS_MAX}곡이에요. ` +
        `아티스트가 많아 ${tierLabel}으로 줄여도 넘쳐서 ` +
        `${bundle.includedArtistCount}/${bundle.artistCount}팀 · ${bundle.selectedCount}곡만 담았어요. ` +
        `빠진 팀은 아티스트를 눌러 따로 들어 보세요.`,
    }
  }

  if (bundle.downgraded && bundle.thinCoverage) {
    return {
      title: '대표곡을 줄여 열었어요',
      body:
        `50곡 제한 때문에 아티스트당 곡 수를 ${tierLabel}으로 낮췄어요. ` +
        `팀당 곡이 적어 맛보기 정도예요. 더 듣고 싶다면 아티스트별 대표곡을 열어 보세요.`,
    }
  }

  if (bundle.downgraded) {
    return {
      title: '대표곡 수를 조정했어요',
      body:
        `YouTube 한도(${WATCH_VIDEOS_MAX}곡)에 맞추려 티어별 곡 수를 ${tierLabel}으로 줄였어요. ` +
        `${bundle.selectedCount}곡이 열려요.`,
    }
  }

  return {
    title: '대표곡을 열었어요',
    body: `${bundle.selectedCount}곡이 YouTube에서 재생돼요.`,
  }
}
