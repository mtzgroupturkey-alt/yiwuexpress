'use client'

import { useEffect } from 'react'
import { DEFAULT_PLACEHOLDER } from '@/lib/image-utils'

/**
 * Global, capture-phase error listener that guarantees EVERY `<img>` on the
 * page (including the underlying `<img>` rendered by `next/image`) falls back
 * to the placeholder image when it fails to load.
 *
 * This is a safety net that covers plain `<img>` tags and any image that was
 * not explicitly wrapped with `SafeImage`/`SafeImg`. Mount it once near the
 * root of the app (e.g. in the root layout).
 */
export function ImageErrorHandler() {
  useEffect(() => {
    const handleError = (event: Event) => {
      const target = event.target as HTMLImageElement | null
      if (!target || target.tagName !== 'IMG') return

      const current = target.getAttribute('src') || ''
      // Already using the placeholder, or already handled → avoid loops.
      if (current.includes(DEFAULT_PLACEHOLDER)) return
      if (target.dataset.fallbackApplied === 'true') return

      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[ImageErrorHandler] image failed, using placeholder:', current)
      }

      target.dataset.fallbackApplied = 'true'
      // Clear responsive sources so the placeholder is not overridden.
      target.removeAttribute('srcset')
      target.removeAttribute('srcSet')
      target.src = DEFAULT_PLACEHOLDER
    }

    document.addEventListener('error', handleError, true)
    return () => document.removeEventListener('error', handleError, true)
  }, [])

  return null
}
