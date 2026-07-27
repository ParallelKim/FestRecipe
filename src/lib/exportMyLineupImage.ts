/** 내 라인업을 한 장 PNG로 저장 (공유·스토리용) */

export interface MyLineupImageOptions {
  festivalName: string
  dateRange?: string
  artistNames: string[]
}

export function downloadMyLineupImage(opts: MyLineupImageOptions): void {
  const { festivalName, dateRange, artistNames } = opts
  if (artistNames.length === 0) return

  const width = 800
  const lineHeight = 34
  const header = 160
  const footer = 56
  const height = Math.min(2400, header + artistNames.length * lineHeight + footer)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#0f1218'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px system-ui, "Noto Sans KR", sans-serif'
  ctx.fillText('내 라인업', 40, 52)

  ctx.font = 'bold 22px system-ui, "Noto Sans KR", sans-serif'
  const titleLines = wrapText(ctx, festivalName, width - 80)
  let y = 88
  for (const line of titleLines) {
    ctx.fillText(line, 40, y)
    y += 28
  }

  if (dateRange) {
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.font = '15px system-ui, "Noto Sans KR", sans-serif'
    ctx.fillText(dateRange, 40, y + 8)
    y += 28
  }

  y = header
  ctx.fillStyle = '#ffffff'
  ctx.font = '16px system-ui, "Noto Sans KR", sans-serif'
  artistNames.forEach((name, i) => {
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fillText(String(i + 1).padStart(2, '0'), 40, y)
    ctx.fillStyle = '#ffffff'
    const lines = wrapText(ctx, name, width - 120)
    for (const line of lines) {
      ctx.fillText(line, 72, y)
      y += lineHeight
    }
  })

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('FestRecipe', 40, height - 24)

  const slug = festivalName.replace(/\s+/g, '-').slice(0, 40)
  const link = document.createElement('a')
  link.download = `festrecipe-my-lineup-${slug}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return [text]
  const lines: string[] = []
  let line = words[0]
  for (let i = 1; i < words.length; i++) {
    const test = `${line} ${words[i]}`
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line)
      line = words[i]
    } else {
      line = test
    }
  }
  lines.push(line)
  if (lines.length === 1 && ctx.measureText(text).width > maxWidth) {
    return [text]
  }
  return lines
}
