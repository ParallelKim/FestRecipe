/**
 * 빌드 타임 번들 데이터 — 서버 없이 정적 JSON을 데이터 소스로 쓰되,
 * 초기 필수 데이터(페스티벌·아티스트·플레이리스트 인덱스, 합계 ~50KB)는
 * 런타임 fetch 대신 번들에 포함해 스피너·요청 워터폴 없이 즉시 렌더한다.
 *
 * SSOT는 여전히 `public/data/**`(수집 파이프라인 산출물 + 정적 서빙)다.
 * 용량이 큰 아티스트별 대표곡(`public/data/playlists/{id}.json`, 합계 ~700KB)은
 * 선택 시점에만 필요하므로 계속 지연 로딩한다(loadJson / FestivalService).
 */
import type { Artist, Festival } from '../types'
import festivalIndex from '../../public/data/festivals/index.json'
import artistsData from '../../public/data/artists.json'
import playlistIndexData from '../../public/data/playlists/index.json'

type RawRecord = Record<string, unknown>

const festivalFiles = import.meta.glob<RawRecord>(
  '../../public/data/festivals/*.json',
  { eager: true, import: 'default' },
)

const festivalRawById: Record<string, RawRecord> = {}
for (const [path, raw] of Object.entries(festivalFiles)) {
  if (path.endsWith('/index.json')) continue
  const id = typeof raw.id === 'string' ? raw.id : undefined
  if (id) festivalRawById[id] = raw
}

/** index.json 순서를 유지하되 실제 파일이 있는 id만 노출 */
const orderedFestivalIds: string[] = (
  festivalIndex as { festivals: string[] }
).festivals.filter((id) => id in festivalRawById)

/** 원천 JSON (mobile mapFestivalView / mapArtistViews 입력용) */
export const artistsRaw = artistsData as unknown as RawRecord[]

export function getFestivalRawById(id: string): RawRecord | null {
  return festivalRawById[id] ?? null
}

/** 대표곡 플레이리스트가 준비된 artistId 집합 (읽기 전용으로 취급) */
export const playlistReadyIds: ReadonlySet<string> = new Set(
  (playlistIndexData as { artists?: string[] }).artists ?? [],
)

/** 타입드 접근 (services/festivals 등 types 경로용) */
export const festivals: Festival[] = orderedFestivalIds.map(
  (id) => festivalRawById[id] as unknown as Festival,
)

export const artists: Artist[] = artistsData as unknown as Artist[]
