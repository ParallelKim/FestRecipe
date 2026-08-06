import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MenuIcon } from 'lucide-react'
import { Container } from './Container'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type NavItem = {
  to: string
  label: string
  hint: string
  isActive: (pathname: string, hash: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: '홈',
    hint: '대표곡으로 미리 듣기',
    isActive: (pathname, hash) => pathname === '/' && hash !== '#festivals',
  },
  {
    to: '/#festivals',
    label: '다가오는 페스티벌',
    hint: '예정·진행 중 라인업',
    isActive: (pathname, hash) => pathname === '/' && hash === '#festivals',
  },
  {
    to: '/festivals/past',
    label: '지난 페스티벌',
    hint: '끝난 축제 다시 듣기',
    isActive: (pathname) => pathname === '/festivals/past',
  },
]

/** 상단 네비 — 로고 + 햄버거 사이드바 */
export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { pathname, hash } = useLocation()

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b border-border bg-background">
      <Container className="flex w-full items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-foreground no-underline"
          onClick={() => setOpen(false)}
        >
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-foreground text-sm font-extrabold text-background">
            F
          </span>
          FestRecipe
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-10 shrink-0"
                aria-label="메뉴 열기"
              />
            }
          >
            <MenuIcon className="size-5" strokeWidth={2.25} />
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-[min(100vw-2.5rem,20rem)] gap-0 p-0 sm:max-w-xs"
          >
            <SheetHeader className="border-b border-border px-5 py-5 pr-14">
              <SheetTitle className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight">
                메뉴
              </SheetTitle>
              <SheetDescription className="text-[13px] leading-snug">
                페스티벌 라인업과 대표곡
              </SheetDescription>
            </SheetHeader>

            <nav className="flex flex-col gap-0.5 p-3" aria-label="사이트 메뉴">
              {NAV_ITEMS.map((item) => {
                const active = item.isActive(pathname, hash)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'rounded-lg px-3 py-3 no-underline transition-colors',
                      active
                        ? 'bg-foreground text-background'
                        : 'text-foreground hover:bg-muted',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="block text-[15px] font-bold leading-snug tracking-tight">
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 block text-[12px] leading-snug',
                        active ? 'text-background/70' : 'text-muted-foreground',
                      )}
                    >
                      {item.hint}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  )
}
