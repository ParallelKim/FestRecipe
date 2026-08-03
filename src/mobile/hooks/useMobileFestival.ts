import { useEffect, useState } from 'react'
import type { MobileArtistView, MobileFestivalView } from '../view/types'
import { fetchArtistsJson, fetchFestivalJson, fetchPlaylistIndex } from '../data/loadJson'
import { mapArtistViews, mapFestivalView } from '../data/mapFestival'

export interface MobileFestivalState {
  festival: MobileFestivalView
  artists: MobileArtistView[]
  artistMap: Map<string, MobileArtistView>
  playlistReady: Set<string>
}

export function useMobileFestival(festivalId: string | undefined) {
  const [state, setState] = useState<MobileFestivalState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    if (!festivalId) {
      setLoading(false)
      setState(null)
      return
    }

    setLoading(true)
    setError(false)

    Promise.all([
      fetchFestivalJson(festivalId),
      fetchArtistsJson(),
      fetchPlaylistIndex(),
    ])
      .then(([festRaw, artistsRaw, playlistReady]) => {
        if (!active) return
        if (!festRaw) {
          setError(true)
          setState(null)
          return
        }
        const festival = mapFestivalView(festRaw)
        if (!festival) {
          setError(true)
          setState(null)
          return
        }
        const artists = mapArtistViews(artistsRaw)
        const artistMap = new Map(artists.map((a) => [a.id, a]))
        setState({ festival, artists, artistMap, playlistReady })
      })
      .catch(() => {
        if (active) {
          setError(true)
          setState(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [festivalId])

  return { state, loading, error }
}
