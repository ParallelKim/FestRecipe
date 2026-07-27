import type { Festival, Artist, ArtistPlaylist } from '../types'

// Memory caches
let cachedArtists: Artist[] | null = null
const cachedFestivals: Record<string, Festival> = {}
let cachedPlaylistIndex: Set<string> | null = null
const cachedPlaylists: Record<string, ArtistPlaylist | null> = {}

export const FestivalService = {
  // Fetch manifest and then fetch all individual festivals
  async getFestivals(): Promise<Festival[]> {
    try {
      const response = await fetch('/data/festivals/index.json')
      const index: { festivals: string[] } = await response.json()

      const festivals = await Promise.all(
        index.festivals.map(async (id) => {
          return this.getFestivalById(id)
        })
      )
      return festivals.filter((f): f is Festival => !!f)
    } catch (error) {
      console.error('Error fetching festivals index:', error)
      return []
    }
  },

  async getFestivalById(id: string): Promise<Festival | undefined> {
    if (cachedFestivals[id]) {
      return cachedFestivals[id]
    }
    try {
      const response = await fetch(`/data/festivals/${id}.json`)
      if (!response.ok) return undefined
      const data: Festival = await response.json()
      cachedFestivals[id] = data
      return data
    } catch (error) {
      console.error(`Error fetching festival ${id}:`, error)
      return undefined
    }
  },

  async getArtists(): Promise<Artist[]> {
    if (cachedArtists) {
      return cachedArtists
    }
    try {
      const response = await fetch('/data/artists.json')
      const data: Artist[] = await response.json()
      cachedArtists = data
      return data
    } catch (error) {
      console.error('Error fetching artists:', error)
      return []
    }
  },

  async getArtistById(id: string): Promise<Artist | undefined> {
    const artists = await this.getArtists()
    return artists.find(a => a.id === id)
  },

  async getArtistsByIds(ids: string[]): Promise<Artist[]> {
    const artists = await this.getArtists()
    return ids
      .map(id => artists.find(a => a.id === id))
      .filter((a): a is Artist => !!a)
  },

  async getPlaylistIndex(): Promise<Set<string>> {
    if (cachedPlaylistIndex) return cachedPlaylistIndex
    try {
      const response = await fetch('/data/playlists/index.json')
      if (!response.ok) {
        cachedPlaylistIndex = new Set()
        return cachedPlaylistIndex
      }
      const data: { artists?: string[] } = await response.json()
      cachedPlaylistIndex = new Set(data.artists || [])
      return cachedPlaylistIndex
    } catch (error) {
      console.error('Error fetching playlist index:', error)
      cachedPlaylistIndex = new Set()
      return cachedPlaylistIndex
    }
  },

  async hasPlaylist(artistId: string): Promise<boolean> {
    const index = await this.getPlaylistIndex()
    return index.has(artistId)
  },

  async getPlaylistForArtist(artistId: string): Promise<ArtistPlaylist | undefined> {
    if (artistId in cachedPlaylists) {
      return cachedPlaylists[artistId] || undefined
    }
    try {
      const response = await fetch(`/data/playlists/${artistId}.json`)
      if (!response.ok) {
        cachedPlaylists[artistId] = null
        return undefined
      }
      const data: ArtistPlaylist = await response.json()
      cachedPlaylists[artistId] = data
      return data
    } catch (error) {
      console.error(`Error fetching playlist ${artistId}:`, error)
      cachedPlaylists[artistId] = null
      return undefined
    }
  },
}
