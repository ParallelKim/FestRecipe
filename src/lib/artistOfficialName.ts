/**
 * 아티스트 UI 표기명
 *
 * MVP: `public/data/artists.json`의 `name`을 사람이 큐레이션한다.
 * `lineupStage === stage3_timetable`인 페스티벌(예: 펜타포트)은
 * 공식 타임테이블 표기를 1순위로 한다 — 펜타포트: https://pentaport.co.kr/108
 *
 * @see docs/ARTIST_DISPLAY_NAMES.md
 */

import type { Artist } from '../types'

/** UI·플레이리스트 제목용. 출처는 artists.json `name`(공식 TT 기준 큐레이션). */
export function officialArtistName(artist: Pick<Artist, 'name'>): string {
  return artist.name
}
