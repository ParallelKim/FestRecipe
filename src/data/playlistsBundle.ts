/**
 * 아티스트별 대표곡 전체(~700KB)를 하나의 모듈로 eager 번들한다.
 * 이 모듈은 오직 동적 import(`playlistData.ts`)로만 참조되므로 Vite가
 * 별도 async 청크로 분리한다 → 초기 크리티컬 렌더를 막지 않으면서
 * 한 번의 요청으로 전체를 받아 캐싱할 수 있다.
 */
type RawRecord = Record<string, unknown>

const files = import.meta.glob<RawRecord>(
  '../../public/data/playlists/*.json',
  { eager: true, import: 'default' },
)

export const playlistsById: Record<string, RawRecord> = {}
for (const [path, raw] of Object.entries(files)) {
  const stem = path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, '')
  if (stem === 'index') continue
  // 조회 키는 fetch 경로(`{artistId}.json`)와 동일한 파일 stem으로 고정
  playlistsById[stem] = raw
}
