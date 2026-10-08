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

    // Remove existing favicon links to force browser tab to re-render icon
    const existingIcons = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"], link[rel*="icon"]'
    )
    existingIcons.forEach((el) => el.remove())

    const createLink = (rel: string, sizes?: string) => {
      const link = document.createElement('link')
      link.rel = rel
      if (mimeType) link.type = mimeType
      if (sizes) link.setAttribute('sizes', sizes)
      link.href = resolvedUrl
      link.setAttribute('data-dynamic-favicon', 'true')
      document.head.appendChild(link)
    }

    createLink('icon')
    createLink('icon', '32x32')
    createLink('icon', '16x16')
    createLink('shortcut icon')
    createLink('apple-touch-icon', '180x180')
    createLink('apple-touch-icon')
  }, [faviconUrl])

  return null
}