'use client'

import { useEffect } from 'react'

interface DynamicFaviconProps {
  faviconUrl?: string
}

export default function DynamicFavicon({ faviconUrl }: DynamicFaviconProps) {
  useEffect(() => {
    if (!faviconUrl) return

    const mimeType = faviconUrl.endsWith('.svg')
      ? 'image/svg+xml'
      : faviconUrl.endsWith('.png')
      ? 'image/png'
      : faviconUrl.endsWith('.ico')
      ? 'image/x-icon'
      : undefined

    // Find and update all existing favicon links
    const existingIcons = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel*="icon"]'
    )

    if (existingIcons.length > 0) {
      existingIcons.forEach(link => {
        link.href = faviconUrl
        if (mimeType) {
          link.type = mimeType
        }
      })
    } else {
      // If no icon tag exists, create them
      const iconLink = document.createElement('link')
      iconLink.rel = 'icon'
      if (mimeType) iconLink.type = mimeType
      iconLink.href = faviconUrl
      iconLink.setAttribute('data-dynamic-favicon', 'true')
      document.head.appendChild(iconLink)

      const appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      appleLink.href = faviconUrl
      appleLink.setAttribute('data-dynamic-favicon', 'true')
      document.head.appendChild(appleLink)
    }
  }, [faviconUrl])

  return null
}