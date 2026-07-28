/**
 * 스마트폰 세로 배경화면 프로필.
 *
 * 참고 (2025–2026 일반론):
 * - 최근 iPhone·안드로이드 플래그십: 세로 약 19.5:9 ~ 20:9
 * - iOS 잠금화면: 상단 시계·다이내믹 아일랜드(~12–15%), 하단 홈 인디케이터·독(~22–25%)에 UI가 겹침
 * - 핵심 타임테이블은 세로 중앙 55~65%에 두는 편이 안전
 * -보내기는 기기 물리 픽셀 또는 1290×2796 등 상위 해상도로 저장 후 다운스케일하는 방식이 흔함
 */

export type WallpaperProfileSource = 'device' | 'preset'

export interface WallpaperProfile {
  id: string
  label: string
  width: number
  height: number
  /** width / height */
  ratio: number
  /** 잠금화면 상단 UI(시계·상태바) — 프레임 높이 대비 */
  safeTopRatio: number
  /** 하단 독·홈 인디케이터 */
  safeBottomRatio: number
  source: WallpaperProfileSource
}

const SAFE_TOP = 0.14
const SAFE_BOTTOM = 0.24

export const WALLPAPER_PRESET_PROFILES: WallpaperProfile[] = [
  {
    id: 'iphone-universal',
    label: 'iPhone 범용 (1290×2796)',
    width: 1290,
    height: 2796,
    ratio: 1290 / 2796,
    safeTopRatio: SAFE_TOP,
    safeBottomRatio: SAFE_BOTTOM,
    source: 'preset',
  },
  {
    id: 'iphone-14',
    label: 'iPhone 14 / 13 (1170×2532)',
    width: 1170,
    height: 2532,
    ratio: 1170 / 2532,
    safeTopRatio: SAFE_TOP,
    safeBottomRatio: SAFE_BOTTOM,
    source: 'preset',
  },
  {
    id: 'android-fhd',
    label: 'Android FHD+ (1080×2400)',
    width: 1080,
    height: 2400,
    ratio: 1080 / 2400,
    safeTopRatio: 0.12,
    safeBottomRatio: 0.22,
    source: 'preset',
  },
  {
    id: 'android-qhd',
    label: 'Android QHD+ (1440×3200)',
    width: 1440,
    height: 3200,
    ratio: 1440 / 3200,
    safeTopRatio: 0.12,
    safeBottomRatio: 0.22,
    source: 'preset',
  },
]

/** CSS 뷰포트·DPR 기반 이 기기 추정 (브라우저 환경). */
export function detectDeviceWallpaperProfile(): WallpaperProfile {
  const cssW = Math.min(window.screen.width, window.screen.height)
  const cssH = Math.max(window.screen.width, window.screen.height)
  const dpr = window.devicePixelRatio || 1
  const width = Math.round(cssW * dpr)
  const height = Math.round(cssH * dpr)
  const isAndroid = /Android/i.test(navigator.userAgent)
  return {
    id: 'device',
    label: `이 기기 (${width}×${height}px)`,
    width,
    height,
    ratio: width / height,
    safeTopRatio: isAndroid ? 0.12 : SAFE_TOP,
    safeBottomRatio: isAndroid ? 0.22 : SAFE_BOTTOM,
    source: 'device',
  }
}

export function resolveWallpaperProfile(profileId: string): WallpaperProfile {
  if (profileId === 'device') return detectDeviceWallpaperProfile()
  return (
    WALLPAPER_PRESET_PROFILES.find((p) => p.id === profileId) ??
    WALLPAPER_PRESET_PROFILES[0]
  )
}

/** 스튜디오 미리보기 프레임 크기 (px, CSS). */
export function computeWallpaperPreviewSize(
  profile: WallpaperProfile,
  stageMaxWidth: number,
  stageMaxHeight: number,
): { width: number; height: number } {
  const pad = 8
  const maxW = Math.max(120, stageMaxWidth - pad)
  const maxH = Math.max(200, stageMaxHeight - pad)
  let height = maxH
  let width = height * profile.ratio
  if (width > maxW) {
    width = maxW
    height = width / profile.ratio
  }
  return {
    width: Math.floor(width),
    height: Math.floor(height),
  }
}

/** PNG 저장 시 html-to-image pixelRatio — 프레임 CSS 너비 → 프로필 물리 너비 */
export function exportPixelRatioForFrame(
  profile: WallpaperProfile,
  frameCssWidth: number,
): number {
  if (frameCssWidth < 1) return 2
  return Math.min(4, Math.max(1, profile.width / frameCssWidth))
}
