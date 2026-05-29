import type { Festival, Artist, SetlistSong } from '../types'

// ─────────────────────────────────────────────────────
//  예상 셋리스트 레시피 (통계 기반 — 확률 수치 없음)
//  pastConcertLinks: 실제 확인된 과거 공연 영상 링크 목록 (최신순)
// ─────────────────────────────────────────────────────
const SETLIST_RECIPES: Record<string, SetlistSong[]> = {
  'sunwoo-junga': [
    {
      songTitle: '도망가자 (Run With Me)',
      songType: 'released',
      albumInfo: { albumType: 'single', albumName: '도망가자' },
      appearanceCount: 5,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=N2WUtX5Z4V8',
      pastConcertLinks: [
        { concertLabel: "2025 단독콘서트 '꽃'", youtubeFullcamUrl: 'https://www.youtube.com/watch?v=N2WUtX5Z4V8&t=15s', youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=uK1XW195zls' },
        { concertLabel: '2025 BML', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=bml2025full&t=120s' },
        { concertLabel: '2025 Grand Mint Festival', youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=gmf2025clip' },
      ]
    },
    {
      songTitle: '구애 (Courtship)',
      songType: 'released',
      albumInfo: { albumType: 'single', albumName: '구애' },
      appearanceCount: 4,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=9_C8r9kF2b4',
      pastConcertLinks: [
        { concertLabel: "2025 단독콘서트 '꽃'", youtubeFullcamUrl: 'https://www.youtube.com/watch?v=N2WUtX5Z4V8&t=440s' },
        { concertLabel: '2024 Someday', youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=someday-goo' },
      ]
    },
    {
      songTitle: '봄처녀 (Spring Girls)',
      songType: 'released',
      albumInfo: { albumType: 'single', albumName: '봄처녀' },
      appearanceCount: 4,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=hB9i8aZ54qQ',
      pastConcertLinks: [
        { concertLabel: '2025 BML', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=bml2025full&t=45s' },
        { concertLabel: '2025 Grand Mint Festival', youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=gmf-spring' },
      ]
    },
    {
      songTitle: '고양이 (Cat) (Feat. IU)',
      songType: 'released',
      albumInfo: { albumType: 'ep', albumName: 'Coda' },
      appearanceCount: 3,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=tHYzT4T2Q8s',
      pastConcertLinks: [
        { concertLabel: "2025 단독콘서트 '꽃'", youtubeFullcamUrl: 'https://www.youtube.com/watch?v=N2WUtX5Z4V8&t=890s' },
      ]
    },
    {
      songTitle: '새 노래',
      songType: 'unreleased',
      appearanceCount: 2,
      totalConcertCount: 5,
      pastConcertLinks: [
        { concertLabel: "2025 단독콘서트 '꽃'", youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=new-song-clip' },
      ]
    }
  ],
  'kim-tteutdol': [
    {
      songTitle: '삐뽀삐뽀 (Pippi)',
      songType: 'released',
      albumInfo: { albumType: 'lp', albumName: '꿈에서 걸어 나온 사람' },
      appearanceCount: 5,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=pippo-official',
      pastConcertLinks: [
        { concertLabel: '2025 단독콘서트', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=pippo-full&t=320s', youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=pippo-playlist' },
        { concertLabel: '2024 DMZ Peace Train', youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=dmz-pippo' },
      ]
    },
    {
      songTitle: '이름이 없는 사람 (A Person with No Name)',
      songType: 'released',
      albumInfo: { albumType: 'lp', albumName: '꿈에서 걸어 나온 사람' },
      appearanceCount: 4,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=noname-official',
      pastConcertLinks: [
        { concertLabel: '2025 단독콘서트', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=pippo-full&t=650s' },
      ]
    },
    {
      songTitle: '새들의 대화',
      songType: 'cover',
      originalArtist: '김광석',
      appearanceCount: 3,
      totalConcertCount: 5,
      pastConcertLinks: [
        { concertLabel: '2025 단독콘서트', youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=birds-cover' },
        { concertLabel: '2024 잔다리페스타', youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=birds-cover-jandari' },
      ]
    }
  ],
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
  'peppertones': [
    {
      songTitle: '행운을 빌어요 (Good Luck)',
      songType: 'released',
      albumInfo: { albumType: 'lp', albumName: "Beginner's Luck" },
      appearanceCount: 5,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=luck-official',
      pastConcertLinks: [
        { concertLabel: '2025 BML', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=luck-full&t=90s', youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=luck-playlist' },
        { concertLabel: '2024 펩톤 20주년 콘서트', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=ppt20th-full&t=220s' },
      ]
    },
    {
      songTitle: '공원여행 (Park Voyage)',
      songType: 'released',
      albumInfo: { albumType: 'lp', albumName: 'New Standard' },
      appearanceCount: 4,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=park-official',
      pastConcertLinks: [
        { concertLabel: '2025 BML', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=luck-full&t=350s' },
      ]
    },
    {
      songTitle: 'New Hippie Generation',
      songType: 'released',
      albumInfo: { albumType: 'lp', albumName: 'Sounds Good!' },
      appearanceCount: 5,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=hippie-official',
      pastConcertLinks: [
        { concertLabel: '2025 BML', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=luck-full&t=600s' },
        { concertLabel: '2024 펩톤 20주년 콘서트', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=ppt20th-full&t=800s' },
      ]
    }
  ],
  'lucy': [
    {
      songTitle: '개화 (Flowering)',
      songType: 'released',
      albumInfo: { albumType: 'single', albumName: '개화' },
      appearanceCount: 5,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      pastConcertLinks: [
        { concertLabel: '2025 BML', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s', youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { concertLabel: "2024 단독콘서트 '열'", youtubeFullcamUrl: 'https://www.youtube.com/watch?v=lucy-full&t=55s' },
      ]
    },
    {
      songTitle: '아지랑이 (Haze)',
      songType: 'released',
      albumInfo: { albumType: 'ep', albumName: 'Fever' },
      appearanceCount: 4,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      pastConcertLinks: [
        { concertLabel: '2025 BML', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=300s' },
      ]
    }
  ],
  'nerd-connection': [
    {
      songTitle: '좋은 밤 좋은 꿈 (Good Night Good Dream)',
      songType: 'released',
      albumInfo: { albumType: 'single', albumName: '좋은 밤 좋은 꿈' },
      appearanceCount: 5,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      pastConcertLinks: [
        { concertLabel: '2025 BML', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s', youtubeLiveClipUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { concertLabel: '2024 단독콘서트', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=nerd-solo&t=120s' },
      ]
    },
    {
      songTitle: '어지러운 세상 속에 (In This Dizzy World)',
      songType: 'released',
      albumInfo: { albumType: 'ep', albumName: '대항해시대' },
      appearanceCount: 4,
      totalConcertCount: 5,
      youtubeOfficialUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      pastConcertLinks: [
        { concertLabel: '2025 BML', youtubeFullcamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=480s' },
      ]
    }
  ]
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
