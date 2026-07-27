/**
 * 아티스트 UI 표기명
 *
 * MVP에서는 자동 선정 알고리즘 대신 `public/data/artists.json`의 `name`을
 * 사람이 직접 큐레이션한다. 런타임은 그 값을 그대로 쓴다.
 *
 * 표기 가이드·검수 체크리스트: docs/ARTIST_DISPLAY_NAMES.md
 */

import type { Artist } from '../types'

/** UI·플레이리스트 제목에 쓰는 표기. 출처는 artists.json `name`(큐레이션). */
export function officialArtistName(artist: Pick<Artist, 'name'>): string {
  return artist.name
}
