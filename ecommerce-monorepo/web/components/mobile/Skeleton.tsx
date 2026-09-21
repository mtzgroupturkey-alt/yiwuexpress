'use client'

import React from 'react'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
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
    full: 'rounded-full',
  }

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-gray-200 dark:bg-slate-800 ${roundedClasses[rounded]} ${className}`}
      {...props}
    />
  )
}
