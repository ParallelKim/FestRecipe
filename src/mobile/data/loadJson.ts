/**
 * 아티스트별 대표곡(~700KB 전체)은 선택 시점에만 필요하므로 지연 로딩한다.
 * 초기 필수 데이터(페스티벌/아티스트/플레이리스트 인덱스)는 번들에서 동기 제공한다
 * (src/data/staticData.ts). — FestivalService·useMobileFestival 참고.
 */

export async function fetchPlaylistJson(artistId: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`/data/playlists/${artistId}.json`)
    if (!res.ok) return null
    return (await res.json()) as Record<string, unknown>
  } catch {
    return null
  }
}
