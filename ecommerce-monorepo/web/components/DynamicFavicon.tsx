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

    // Safely update existing favicon links in-place WITHOUT removing DOM nodes.
    // Removing nodes with el.remove() detaches them from parentNode behind React's back,
    // which causes: "Cannot read properties of null (reading 'removeChild') at unmountHoistable"
    const existingIcons = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]'
    )

    if (existingIcons.length > 0) {
      existingIcons.forEach((el) => {
        el.href = resolvedUrl
        if (mimeType) el.type = mimeType
      })
    } else {
      let dynamicLink = document.querySelector<HTMLLinkElement>('link[data-dynamic-favicon="true"]')
      if (!dynamicLink) {
        dynamicLink = document.createElement('link')
        dynamicLink.rel = 'icon'
        dynamicLink.setAttribute('data-dynamic-favicon', 'true')
        document.head.appendChild(dynamicLink)
      }
      dynamicLink.href = resolvedUrl
      if (mimeType) dynamicLink.type = mimeType
    }
  }, [faviconUrl])

  return null
}