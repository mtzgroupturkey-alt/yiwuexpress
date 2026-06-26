'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  noPadding?: boolean
  as?: 'div' | 'section' | 'main' | 'header' | 'footer' | 'article'
}

export function Container({
  children,
  className,
  maxWidth = '2xl',
  noPadding = false,
  as: Component = 'div',
}: ContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-[1400px]',
    full: 'max-w-full',
  }

  const paddingClasses = noPadding ? '' : 'px-4 sm:px-6 lg:px-8'

  return (
    <Component
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        paddingClasses,
        className
      )}
    >
      {children}
    </Component>
  )
}
