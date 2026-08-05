import { useMemo } from 'react'
import type { MobileArtistView, MobileFestivalView } from '../view/types'
import {
  artistsRaw,
  getFestivalRawById,
  playlistReadyIds,
} from '../../data/staticData'
import { mapArtistViews, mapFestivalView } from '../data/mapFestival'

interface MobileFestivalState {
  festival: MobileFestivalView
  artists: MobileArtistView[]
  artistMap: Map<string, MobileArtistView>
  playlistReady: Set<string>
}

interface MobileFestivalResult {
  state: MobileFestivalState | null
  loading: boolean
  error: boolean
}

/**
 * 페스티벌·아티스트·플레이리스트 인덱스는 번들 데이터에서 동기 계산한다.
 * 런타임 fetch가 없으므로 loading은 항상 false이며, 초기 스피너/워터폴이 사라진다.
 * (아티스트별 대표곡은 useMobileListen에서 선택 시점에만 지연 로딩)
 */
export function useMobileFestival(
  festivalId: string | undefined,
): MobileFestivalResult {
  return useMemo(() => {
    if (!festivalId) return { state: null, loading: false, error: false }

    const raw = getFestivalRawById(festivalId)
    if (!raw) return { state: null, loading: false, error: true }

    const festival = mapFestivalView(raw)
    if (!festival) return { state: null, loading: false, error: true }

    const artists = mapArtistViews(artistsRaw)
    const artistMap = new Map(artists.map((a) => [a.id, a]))
    return {
      state: {
        festival,
        artists,
        artistMap,
        playlistReady: new Set(playlistReadyIds),
      },
      loading: false,
      error: false,
    }
  }, [festivalId])
}
