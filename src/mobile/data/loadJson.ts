/** 원천 JSON fetch — FestivalService·types 미사용 */

export async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function fetchFestivalJson(festivalId: string): Promise<Record<string, unknown> | null> {
  return fetchJson<Record<string, unknown>>(`/data/festivals/${festivalId}.json`)
}

export async function fetchArtistsJson(): Promise<Record<string, unknown>[]> {
  const data = await fetchJson<Record<string, unknown>[]>('/data/artists.json')
  return data ?? []
}

export async function fetchPlaylistIndex(): Promise<Set<string>> {
  const data = await fetchJson<{ artists?: string[] }>('/data/playlists/index.json')
  return new Set(data?.artists ?? [])
}

export async function fetchPlaylistJson(artistId: string): Promise<Record<string, unknown> | null> {
  return fetchJson<Record<string, unknown>>(`/data/playlists/${artistId}.json`)
}
