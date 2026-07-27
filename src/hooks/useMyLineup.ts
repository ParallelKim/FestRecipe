import { useCallback, useEffect, useState } from 'react'
import {
  clearMyLineup,
  loadMyLineupArtistIds,
  saveMyLineupArtistIds,
  toggleMyLineupArtist,
} from '../lib/myLineupStorage'

export function useMyLineup(festivalId: string | undefined) {
  const [artistIds, setArtistIds] = useState<string[]>([])

  useEffect(() => {
    if (!festivalId) {
      setArtistIds([])
      return
    }
    setArtistIds(loadMyLineupArtistIds(festivalId))
  }, [festivalId])

  const persist = useCallback(
    (next: string[]) => {
      if (!festivalId) return
      saveMyLineupArtistIds(festivalId, next)
      setArtistIds(next)
    },
    [festivalId],
  )

  const toggle = useCallback(
    (artistId: string) => {
      if (!festivalId) return
      const next = toggleMyLineupArtist(festivalId, artistId)
      setArtistIds(next)
    },
    [festivalId],
  )

  const clear = useCallback(() => {
    if (!festivalId) return
    clearMyLineup(festivalId)
    setArtistIds([])
  }, [festivalId])

  const has = useCallback((artistId: string) => artistIds.includes(artistId), [artistIds])

  return {
    artistIds,
    count: artistIds.length,
    toggle,
    clear,
    has,
    setArtistIds: persist,
  }
}
