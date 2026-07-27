/**
 * 아티스트 공식 표기명(Official Display Name) 선정 기준
 * ─────────────────────────────────────────────────────
 * 목적: UI·플레이리스트 제목에 쓰는 이름을 하나로 고정한다.
 *       “한글 음독 vs 영문” 혼선을 없애고, 팬/아티스트가
 *       공식으로 인식하는 브랜드 표기를 우선한다.
 *
 * 우선순위
 *   1. 수동 오버라이드 (OFFICIAL_NAME_OVERRIDES)
 *      - YTM 콜라보/핸들/오기, 또는 국내 통용 한글명이 더 표준인 경우
 *   2. YouTube Music 아티스트명 (ytmArtist.name) — 정제 후
 *      - 해외 액트·라틴 브랜드(QWER, HYUKOH, Khruangbin…)의 1차 근거
 *   3. englishName
 *   4. 기존 name (legacy)
 *
 * 국내/해외 운용 가이드
 *   - 해외: YTM(또는 원어) 표기. 한글 음독 표기는 쓰지 않는다.
 *   - 국내 라틴 브랜드: YTM 브랜드 유지 (QWER, HYUKOH, LEENALCHI…)
 *   - 국내 한글 통용명: 오버라이드로 한글 고정 (백현진, 향우회…)
 *
 * YTM 기각·정제
 *   - 다른 아티스트와 쉼표로 묶인 콜라보 표기 → 기각
 *   - `Name (번역)` 병기 → 괄호 밖 주표기만
 *   - `원어 - 로마자` / `로마자 - 원어` → CJK 원어가 있으면 원어,
 *     없으면 로마자/영문 쪽
 *   - `한글 LATIN`처럼 동일명의 이중 표기 → 한글 우선
 *   - Topic 접미사 제거
 *   - YTM이 englishName의 축약이면(더 짧은 접두) englishName 채택
 *
 * 의도적으로 YTM 브랜드를 따르는 예
 *   - QWER, HYUKOH, LEENALCHI, Khruangbin, Pixies …
 * 수동 오버라이드 예
 *   - 향우회 (YTM: Socialclub Hyangwu, 음원 크레딧·통용명: 향우회)
 *   - 권진아 (YTM: 챈슬러, 권진아)
 */

import type { Artist } from '../types'

/** YTM/자동 규칙으로 부족한 경우만 수동 지정 */
export const OFFICIAL_NAME_OVERRIDES: Record<string, string> = {
  // YTM 오염·핸들·축약
  'socialclub-hyangwu': '향우회',
  'kwon-jina': '권진아',
  'we-steal-oranges': '감귤서리단',
  'fat-hamster-and-kang-new': 'Fat Hamster & Kang New',
  // 국내 솔로/통용 한글명이 YTM 로마자보다 시장 표준인 경우
  'baek-hyeonjin': '백현진',
  'jang-pillsoon': '장필순',
  'lee-seung-yoon': '이승윤',
  'yang-jeong-hoon': '양정훈',
  'band-nah': '나상현씨밴드',
  'noizegarden': '노이즈가든',
  'dabda': '다브다',
}

const CJK = /[\uac00-\ud7a3\u3040-\u30ff\u4e00-\u9fff]/
const LATIN = /[A-Za-z]/

export type OfficialNameSource = 'override' | 'ytm' | 'english' | 'legacy'

export interface OfficialNameResult {
  name: string
  source: OfficialNameSource
}

function hasCjk(s: string): boolean {
  return CJK.test(s)
}

function onlyCjk(s: string): boolean {
  const t = s.replace(/[\s\-.·_'’!,]/g, '')
  return t.length > 0 && !LATIN.test(t) && CJK.test(t)
}

function onlyLatin(s: string): boolean {
  const t = s.replace(/[\s\-.·_'’!,0-9]/g, '')
  return t.length > 0 && !CJK.test(t) && LATIN.test(t)
}

/** 콜라보 나열로 보이는 YTM명 기각 */
export function isContaminatedYtmName(ytmName: string, artistHint?: string): boolean {
  if (!ytmName.includes(',')) return false
  const parts = ytmName.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length < 2) return false
  if (!artistHint) return true
  const hint = artistHint.toLowerCase()
  // 힌트(한글명/영문명)가 한 조각에만 정확히 있으면 오염으로 본다
  const matches = parts.filter((p) => {
    const pl = p.toLowerCase()
    return pl === hint || pl.includes(hint) || hint.includes(pl)
  })
  return matches.length !== 1 || parts.length > 2
}

/**
 * YTM 원문을 공식 표기 후보로 정제.
 * 부적절하면 null.
 */
export function normalizeYtmArtistName(
  raw: string | null | undefined,
  opts?: { artistHint?: string; englishName?: string },
): string | null {
  if (!raw) return null
  let s = raw.trim()
  if (!s) return null

  s = s.replace(/\s+-\s*Topic$/i, '').trim()

  if (isContaminatedYtmName(s, opts?.artistHint)) return null

  // Primary (Translation)
  const paren = s.match(/^(.+?)\s*\((.+)\)$/)
  if (paren) {
    s = paren[1].trim()
  }

  // Bilingual dash: 宋冬野 - Song Dongye
  const dash = s.match(/^(.+?)\s+-\s+(.+)$/)
  if (dash) {
    const a = dash[1].trim()
    const b = dash[2].trim()
    if (onlyCjk(a) && onlyLatin(b)) s = a
    else if (onlyLatin(a) && onlyCjk(b)) s = b
    else if (hasCjk(a) && !hasCjk(b)) s = a
    else if (hasCjk(b) && !hasCjk(a)) s = b
  }

  // 다브다 DABDA / 노이즈가든 already hangul-only
  const dual = s.match(/^([\uac00-\ud7a3][\uac00-\ud7a3\s]*)\s+([A-Za-z][A-Za-z0-9\s.'’!-]*)$/)
  if (dual) {
    s = dual[1].trim()
  }

  // YTM이 englishName 축약인 경우
  const en = (opts?.englishName || '').trim()
  if (en && s && en.toLowerCase() !== s.toLowerCase()) {
    const enL = en.toLowerCase()
    const sL = s.toLowerCase()
    if (enL.startsWith(sL) && en.length > s.length + 2) {
      return en
    }
  }

  return s || null
}

export function resolveOfficialArtistName(input: {
  id: string
  name?: string
  englishName?: string
  ytmName?: string | null
}): OfficialNameResult {
  const override = OFFICIAL_NAME_OVERRIDES[input.id]
  if (override) return { name: override, source: 'override' }

  const ytm = normalizeYtmArtistName(input.ytmName, {
    artistHint: input.name || input.englishName,
    englishName: input.englishName,
  })
  if (ytm) return { name: ytm, source: 'ytm' }

  if (input.englishName?.trim()) {
    return { name: input.englishName.trim(), source: 'english' }
  }

  return { name: (input.name || input.id).trim(), source: 'legacy' }
}

/** UI용 — Artist 객체에서 공식 표기명 */
export function officialArtistName(artist: Pick<Artist, 'id' | 'name' | 'englishName' | 'ytmName'>): string {
  // name 필드가 이미 정책으로 동기화된 값을 담는 것이 원칙.
  // ytmName이 있으면 런타임에도 동일 규칙으로 재해석해 드리프트 방지.
  if (artist.ytmName || OFFICIAL_NAME_OVERRIDES[artist.id]) {
    return resolveOfficialArtistName({
      id: artist.id,
      name: artist.name,
      englishName: artist.englishName,
      ytmName: artist.ytmName,
    }).name
  }
  return artist.name
}
