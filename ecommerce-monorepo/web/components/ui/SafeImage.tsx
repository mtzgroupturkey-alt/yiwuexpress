'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import { DEFAULT_PLACEHOLDER, getFallbackSrc } from '@/lib/image-utils'

export interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined
  alt: string
  fallbackSrc?: string
}

/**
 * Drop-in replacement for `next/image` that automatically swaps to a
 * placeholder whenever the original image fails to load.
 *
 * Usage is identical to `next/image`:
 *   <SafeImage src={product.image} alt={product.name} width={500} height={500} />
 *   <SafeImage src={url} alt="..." fill />
 */
export function SafeImage({
  src,
  fallbackSrc = DEFAULT_PLACEHOLDER,
  alt = '',
  onError,
  ...props
}: SafeImageProps) {
  const fallback = getFallbackSrc(fallbackSrc)
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallback)

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={(event) => {
        if (currentSrc !== fallback) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[SafeImage] failed to load, using placeholder:', src)
          }
          setCurrentSrc(fallback)
        }
        onError?.(event)
      }}
    />
  )
}

export interface SafeImgProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string
}

/**
 * Plain `<img>` variant with the same automatic fallback behaviour.
 *
 * Usage:
 *   <SafeImg src={avatar} alt={name} className="w-10 h-10 rounded-full" />
 */
export function SafeImg({
  src,
  fallbackSrc = DEFAULT_PLACEHOLDER,
  alt = '',
  onError,
  ...props
}: SafeImgProps) {
  const fallback = getFallbackSrc(fallbackSrc)
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallback)

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      onError={(event) => {
        if (currentSrc !== fallback) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[SafeImg] failed to load, using placeholder:', src)
          }
          setCurrentSrc(fallback)
        }
        onError?.(event)
      }}
    />
  )
}
