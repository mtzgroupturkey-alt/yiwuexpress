'use client'

import { useEffect } from 'react'

interface DynamicFaviconProps {
  faviconUrl?: string
}

export default function DynamicFavicon({ faviconUrl }: DynamicFaviconProps) {
  useEffect(() => {
    if (!faviconUrl) return

    // Ensure upload URLs route through /api/uploads/
    let resolvedUrl = faviconUrl
    if (resolvedUrl.startsWith('/uploads/')) {
      resolvedUrl = `/api${resolvedUrl}`
    } else if (resolvedUrl.startsWith('uploads/')) {
      resolvedUrl = `/api/${resolvedUrl}`
    }

    const mimeType = resolvedUrl.includes('.svg')
      ? 'image/svg+xml'
      : resolvedUrl.includes('.png')
      ? 'image/png'
      : resolvedUrl.includes('.ico')
      ? 'image/x-icon'
      : undefined

    // Find and update all existing favicon links
    const existingIcons = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"], link[rel*="icon"]'
    )

    if (existingIcons.length > 0) {
      existingIcons.forEach((link) => {
        link.href = resolvedUrl
        if (mimeType) {
          link.type = mimeType
        }
      })
    } else {
      // If no icon tag exists, create them
      const iconLink = document.createElement('link')
      iconLink.rel = 'icon'
      if (mimeType) iconLink.type = mimeType
      iconLink.href = resolvedUrl
      iconLink.setAttribute('data-dynamic-favicon', 'true')
      document.head.appendChild(iconLink)

      const shortcutLink = document.createElement('link')
      shortcutLink.rel = 'shortcut icon'
      if (mimeType) shortcutLink.type = mimeType
      shortcutLink.href = resolvedUrl
      shortcutLink.setAttribute('data-dynamic-favicon', 'true')
      document.head.appendChild(shortcutLink)

      const appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      appleLink.href = resolvedUrl
      appleLink.setAttribute('data-dynamic-favicon', 'true')
      document.head.appendChild(appleLink)
    }
  }, [faviconUrl])

  return null
}