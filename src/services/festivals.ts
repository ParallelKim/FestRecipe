import type { Festival, Artist, SetlistSong } from '../types'

// ─────────────────────────────────────────────────────
//  예상 셋리스트 레시피 (통계 기반 — 확률 수치 없음)
//  pastConcertLinks: 실제 확인된 과거 공연 영상 링크 목록 (최신순)
// ─────────────────────────────────────────────────────
const SETLIST_RECIPES: Record<string, SetlistSong[]> = {
  'the-volunteers': [
    {
      songTitle: 'PINKTOP',
      songType: 'released',
      albumInfo: { albumType: 'lp', albumName: 'The Volunteers' },
      appearanceCount: 5,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=pinktop-official',
      pastConcertLinks: [
        { concertLabel: '2025 펜타포트', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=pinktop-full&t=45s', youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=pinktop-playlist' },
        { concertLabel: '2024 GMF', youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=pinktop-gmf' },
      ]
    },
    {
      songTitle: 'Radio',
      songType: 'released',
      albumInfo: { albumType: 'lp', albumName: 'The Volunteers' },
      appearanceCount: 4,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=radio-official',
      pastConcertLinks: [
        { concertLabel: '2025 펜타포트', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=pinktop-full&t=320s' },
      ]
    },
    {
      songTitle: 'Summer',
      songType: 'released',
      albumInfo: { albumType: 'single', albumName: 'Summer' },
      appearanceCount: 4,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=summer-official',
      pastConcertLinks: [
        { concertLabel: '2024 단독콘서트', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=summer-full&t=180s' },
        { concertLabel: '2024 GMF', youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=summer-gmf' },
      ]
    }
  ],
}

// Memory caches
let cachedArtists: Artist[] | null = null
const cachedFestivals: Record<string, Festival> = {}

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

  getRecipeForArtist(artistId: string): SetlistSong[] | undefined {
    return SETLIST_RECIPES[artistId]
  }
}
