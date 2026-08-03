import { useCallback, useEffect, useState } from 'react'
import {
  loadMyLineupArtistIds,
  saveMyLineupArtistIds,
} from '../../lib/myLineupStorage'

export function useMobileLineup(festivalId: string) {
  const [artistIds, setArtistIds] = useState<string[]>(() =>
    loadMyLineupArtistIds(festivalId),
  )

  useEffect(() => {
    setArtistIds(loadMyLineupArtistIds(festivalId))
  }, [festivalId])

  const persist = useCallback(
    (next: string[]) => {
      setArtistIds(next)
      saveMyLineupArtistIds(festivalId, next)
    },
    [festivalId],
  )

  const toggle = useCallback(
    (artistId: string) => {
      const next = artistIds.includes(artistId)
        ? artistIds.filter((id) => id !== artistId)
        : [...artistIds, artistId]
      persist(next)
    },
    [artistIds, persist],
  )

  const setIds = useCallback(
    (next: string[]) => {
      persist(next)
    },
    [persist],
  )

  return { artistIds, toggle, setIds }
}
