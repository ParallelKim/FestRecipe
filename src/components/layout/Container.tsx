import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps {
  children: ReactNode
  className?: string
}

/** 페이지 폭·반응형 패딩 — 글로벌 `.container` 클래스 대체 */
export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-[1440px] px-4 md:px-12', className)}>
      {children}
    </div>
  )
}
