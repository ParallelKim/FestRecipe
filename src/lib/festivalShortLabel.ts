import type { Festival } from '../types'

/** 배경화면 등 짧은 라벨 — `shortName` 우선 (대문자 정규화) */
export function festivalShortLabel(festival: Pick<Festival, 'name' | 'shortName'>): string {
  const short = festival.shortName?.trim()
  if (short) return short.toUpperCase()
  return festival.name
}
