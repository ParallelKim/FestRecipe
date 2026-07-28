import type { FestivalStageStyle } from '../types'

export interface ResolvedStageTheme {
  stageName: string
  shortLabel: string
  bg: string
  fg: string
  accent: string
  soft: string
  lineupBg: string
}

const DEFAULT_THEME: Omit<ResolvedStageTheme, 'stageName' | 'shortLabel'> = {
  bg: '#181d26',
  fg: '#ffffff',
  accent: '#41454d',
  soft: '#f3f4f6',
  lineupBg: '#eef0f3',
}

/** 페스티벌 JSON 없을 때 이름 휴리스틱 (펜타포트 등 레거시) */
function legacyStageTheme(stageName: string): ResolvedStageTheme {
  const n = stageName.replace(/\s+/g, '').toLowerCase()
  if (n.includes('kb') || n.includes('국민')) {
    return {
      stageName,
      shortLabel: 'KB',
      bg: '#f5d000',
      fg: '#141414',
      accent: '#c9a800',
      soft: '#fff6b8',
      lineupBg: '#fff9dc',
    }
  }
  if (n.includes('monster') || n.includes('몬스터')) {
    return {
      stageName,
      shortLabel: '몬스터',
      bg: '#7ac143',
      fg: '#141414',
      accent: '#5a9a2e',
      soft: '#dff5c8',
      lineupBg: '#ecf8e0',
    }
  }
  if (n.includes('stanley') || n.includes('스탠리')) {
    return {
      stageName,
      shortLabel: '스탠리',
      bg: '#1a1a1a',
      fg: '#ffffff',
      accent: '#1a1a1a',
      soft: '#ececec',
      lineupBg: '#f0f0f0',
    }
  }
  return {
    stageName,
    shortLabel: stageName.length > 6 ? `${stageName.slice(0, 6)}…` : stageName,
    ...DEFAULT_THEME,
  }
}

export function resolveStageTheme(
  stageName: string,
  styles: FestivalStageStyle[] | undefined,
): ResolvedStageTheme {
  const configured = styles?.find((s) => s.stageName === stageName)
  if (configured) {
    return {
      stageName,
      shortLabel: configured.shortLabel || legacyStageTheme(stageName).shortLabel,
      bg: configured.bg,
      fg: configured.fg,
      accent: configured.accent,
      soft: configured.soft,
      lineupBg: configured.lineupBg ?? configured.soft,
    }
  }
  return legacyStageTheme(stageName)
}

export function stageThemeMap(
  stageNames: string[],
  styles: FestivalStageStyle[] | undefined,
): Map<string, ResolvedStageTheme> {
  const map = new Map<string, ResolvedStageTheme>()
  for (const name of stageNames) {
    map.set(name, resolveStageTheme(name, styles))
  }
  return map
}

/** 칩·카드 등 스테이지 미지정 라인업 하이라이트 */
export function festivalLineupHighlightFallback(
  styles: FestivalStageStyle[] | undefined,
  festivalFallback?: string,
): string {
  if (festivalFallback) return festivalFallback
  if (styles?.[0]?.lineupBg) return styles[0].lineupBg
  if (styles?.[0]?.soft) return styles[0].soft
  return 'var(--color-lineup-bg)'
}
