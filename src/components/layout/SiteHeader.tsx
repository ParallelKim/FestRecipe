import { Link } from 'react-router-dom'
import { Container } from './Container'

/** 상단 네비 — sticky 헤더 + 로고·링크 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b border-border bg-background">
      <Container className="flex w-full items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-foreground no-underline"
        >
          <span
            className="inline-flex size-7 items-center justify-center rounded-md bg-foreground text-sm font-extrabold text-background"
          >
            F
          </span>
          FestRecipe
        </Link>

        <Link
          to="/#festivals"
          className="text-sm font-semibold text-muted-foreground no-underline hover:text-foreground"
        >
          페스티벌
        </Link>
      </Container>
    </header>
  )
}
