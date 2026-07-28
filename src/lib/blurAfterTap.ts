/** 모바일에서 탭 후 :focus 스타일이 남는 현상 완화 */
export function blurAfterTap(target: EventTarget | null): void {
  if (target instanceof HTMLElement) {
    requestAnimationFrame(() => target.blur())
  }
}
