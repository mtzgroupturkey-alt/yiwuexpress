'use client'

import React from 'react'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
}

export function Skeleton({
  className = '',
  rounded = 'md',
  ...props
}: SkeletonProps) {
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  }

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 dark:before:via-white/10 before:to-transparent ${roundedClasses[rounded]} ${className}`}
      {...props}
    />
  )
}

export function ProductCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 overflow-hidden flex flex-col justify-between p-2 space-y-2.5 shadow-2xs ${className}`}
    >
      <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-800/60 rounded-xl overflow-hidden">
        <Skeleton className="w-full h-full" rounded="xl" />
      </div>
      <div className="space-y-2 px-1">
        <Skeleton className="w-16 h-2.5" rounded="sm" />
        <Skeleton className="w-full h-3.5" rounded="sm" />
        <Skeleton className="w-4/5 h-3.5" rounded="sm" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="w-20 h-4" rounded="sm" />
          <Skeleton className="w-8 h-8" rounded="lg" />
        </div>
      </div>
    </div>
  )
}
