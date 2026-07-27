import { toPng } from 'html-to-image'

export async function downloadElementPng(
  element: HTMLElement,
  filename: string,
  pixelRatio = 2,
): Promise<void> {
  const dataUrl = await toPng(element, {
    pixelRatio,
    cacheBust: true,
    skipAutoScale: true,
  })
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}
