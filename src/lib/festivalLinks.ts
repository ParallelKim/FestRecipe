/** 지도 앱/웹으로 위치를 여는 검색 딥링크 */

/** 네이버지도 검색 (모바일에서 앱 연동되는 경우가 많음) */
export function buildNaverMapSearchUrl(query: string): string | null {
  const q = (query || '').trim()
  if (!q) return null
  return `https://map.naver.com/p/search/${encodeURIComponent(q)}`
}

/** Google Maps 검색 (해외·폴백용) */
export function buildGoogleMapsSearchUrl(query: string): string | null {
  const q = (query || '').trim()
  if (!q) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

/** 페스티벌 위치용 기본 지도 링크 (네이버 우선) */
export function buildFestivalMapUrl(
  festival: { location?: string; mapUrl?: string | null },
): string | null {
  const custom = (festival.mapUrl || '').trim()
  if (custom) return custom
  return buildNaverMapSearchUrl(festival.location || '')
}
