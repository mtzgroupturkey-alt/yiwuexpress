'use client'

import { useEffect } from 'react'

interface DynamicFaviconProps {
  faviconUrl?: string
}

export default function DynamicFavicon({ faviconUrl }: DynamicFaviconProps) {
  useEffect(() => {
    if (!faviconUrl) return

    // Remove existing dynamic favicon links (only those we created)
    const existingLinks = document.querySelectorAll('link[data-dynamic-favicon="true"]')
    existingLinks.forEach(link => {
      try {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
      } catch (error) {
        // Silently handle removal errors
      }
    })

    // Add cache-busting parameter
    const timestamp = new Date().getTime()
    const faviconUrlWithTimestamp = `${faviconUrl}?t=${timestamp}`

    // Create new favicon link
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 
                faviconUrl.endsWith('.png') ? 'image/png' : 'image/x-icon'
    link.href = faviconUrlWithTimestamp
    link.setAttribute('data-dynamic-favicon', 'true')

    // Create apple touch icon for better mobile support
    const appleLink = document.createElement('link')
    appleLink.rel = 'apple-touch-icon'
    appleLink.href = faviconUrlWithTimestamp
    appleLink.setAttribute('data-dynamic-favicon', 'true')

    // Add to document head
    document.head.appendChild(link)
    document.head.appendChild(appleLink)

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.debug('🎨 Favicon updated:', faviconUrl)
    }

    // Cleanup function with safety checks
    return () => {
      try {
        if (link && link.parentNode) {
          link.parentNode.removeChild(link)
        }
      } catch (error) {
        // Element may have already been removed
      }
      
      try {
        if (appleLink && appleLink.parentNode) {
          appleLink.parentNode.removeChild(appleLink)
        }
      } catch (error) {
        // Element may have already been removed
      }
    }
  }, [faviconUrl])

  return null // This component doesn't render anything visible
}