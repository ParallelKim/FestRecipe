import { toPng } from 'html-to-image'

/**
 * html-to-image는 PNG 생성 시 문서의 모든 @font-face를 인라이닝한다.
 * Noto Sans KR처럼 유니코드 범위별로 100개 이상 쪼개진 폰트는 서브셋 전부를
 * 매 저장마다 다운로드해 매우 느리다. 여기서는 캡처 대상 텍스트와 교집합이
 * 있는 서브셋만 골라 한 번만 받아 두고 재사용한다.
 */
const GOOGLE_FONTS_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap'

let rawFontCssPromise: Promise<string> | null = null
const embedCssCache = new Map<string, Promise<string | null>>()

function fetchGoogleFontCss(): Promise<string> {
  if (!rawFontCssPromise) {
    rawFontCssPromise = fetch(GOOGLE_FONTS_CSS_URL).then((res) => {
      if (!res.ok) throw new Error(`font css fetch failed: ${res.status}`)
      return res.text()
    })
  }
  return rawFontCssPromise
}

/** "U+0000-00FF, U+AC??" 형태를 [start, end] 코드포인트 범위로 변환 */
function parseUnicodeRanges(value: string): Array<[number, number]> {
  return value.split(',').map((part) => {
    const range = part.trim().replace(/^U\+/i, '')
    const [a, b] = range.split('-')
    const start = parseInt(a.replace(/\?/g, '0'), 16)
    const end = b
      ? parseInt(b.replace(/\?/g, 'F'), 16)
      : parseInt(a.replace(/\?/g, 'F'), 16)
    return [start, end]
  })
}

async function buildSubsetFontEmbedCSS(text: string): Promise<string | null> {
  const used = new Set<number>()
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp !== undefined) used.add(cp)
  }
  // ASCII는 항상 포함 (숫자·시간·콜론 등)
  for (let c = 0x20; c <= 0x7e; c++) used.add(c)

  const cssText = await fetchGoogleFontCss()
  const blocks = cssText.match(/@font-face\s*{[^}]*}/g) ?? []

  const picked = blocks.filter((block) => {
    const m = block.match(/unicode-range:\s*([^;]+);/)
    if (!m) return true
    return parseUnicodeRanges(m[1]).some(([start, end]) => {
      for (const cp of used) {
        if (cp >= start && cp <= end) return true
      }
      return false
    })
  })

  const urls = new Set<string>()
  for (const block of picked) {
    for (const m of block.matchAll(/url\((https:[^)]+)\)/g)) urls.add(m[1])
  }

  const dataByUrl = new Map<string, string>()
  await Promise.all(
    [...urls].map(async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`font file fetch failed: ${res.status}`)
      const bytes = new Uint8Array(await res.arrayBuffer())
      let bin = ''
      for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
      }
      dataByUrl.set(url, `data:font/woff2;base64,${btoa(bin)}`)
    }),
  )

  return picked
    .map((block) =>
      block.replace(
        /url\((https:[^)]+)\)/g,
        (_m, url: string) => `url(${dataByUrl.get(url) ?? url})`,
      ),
    )
    .join('\n')
}

function getSubsetFontEmbedCSS(text: string): Promise<string | null> {
  const key = [...new Set(text)].sort().join('')
  let cached = embedCssCache.get(key)
  if (!cached) {
    cached = buildSubsetFontEmbedCSS(text).catch(() => null)
    embedCssCache.set(key, cached)
  }
  return cached
}

/** 저장 버튼 클릭 전에 폰트 CSS를 미리 준비해 클릭 대기 시간을 없앤다. */
export function preloadExportFonts(text: string): void {
  void getSubsetFontEmbedCSS(text)
}

export async function downloadElementPng(
  element: HTMLElement,
  filename: string,
  pixelRatio = 2,
): Promise<void> {
  const fontEmbedCSS = await getSubsetFontEmbedCSS(element.textContent ?? '')
  const dataUrl = await toPng(element, {
    pixelRatio,
    skipAutoScale: true,
    ...(fontEmbedCSS ? { fontEmbedCSS } : {}),
  })
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}
