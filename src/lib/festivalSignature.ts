export type FestivalSignatureColor = 'cream' | 'forest' | 'coral' | 'dark'

export interface FestivalSignatureTheme {
  bg: string
  text: string
  muted: string
}

export function getFestivalSignatureTheme(
  signatureColor?: string,
): FestivalSignatureTheme {
  switch (signatureColor) {
    case 'forest':
      return {
        bg: 'var(--color-sig-forest)',
        text: '#ffffff',
        muted: 'rgba(255,255,255,0.72)',
      }
    case 'coral':
      return {
        bg: 'var(--color-sig-coral)',
        text: '#ffffff',
        muted: 'rgba(255,255,255,0.72)',
      }
    case 'dark':
      return {
        bg: 'var(--color-surface-dark)',
        text: '#ffffff',
        muted: 'rgba(255,255,255,0.72)',
      }
    default:
      return {
        bg: 'var(--color-sig-cream)',
        text: 'var(--color-ink)',
        muted: 'var(--color-muted)',
      }
  }
}
