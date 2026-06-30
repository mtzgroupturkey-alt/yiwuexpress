'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface BreadcrumbItem {
  name: string
  href: string
}

interface PageHeroProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  backgroundImage?: string
  pageSlug?: string // For static pages: 'about', 'contact', etc.
  categoryId?: string // For category pages
}

interface BreadcrumbSetting {
  imageUrl: string
  mobileImageUrl?: string
  overlayColor?: string
  title?: string
  subtitle?: string
}

export function PageHero({ title, description, breadcrumbs, backgroundImage, pageSlug, categoryId }: PageHeroProps) {
  const defaultBreadcrumbs: BreadcrumbItem[] = breadcrumbs || []
  const pathname = usePathname()
  const [bgSettings, setBgSettings] = useState<BreadcrumbSetting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBreadcrumbBackground = async () => {
      try {
        // Auto-detect page slug from pathname if not provided
        const detectedSlug = pageSlug || pathname?.split('/')[1] || ''
        
        console.log('[PageHero] Fetching background for:', { detectedSlug, categoryId, pathname })
        
        // Build query params
        const params = new URLSearchParams()
        if (categoryId) {
          console.log('[PageHero] Using categoryId:', categoryId)
          params.append('categoryId', categoryId)
        } else if (detectedSlug) {
          // For products page, don't pass pageSlug - let API use shop_default
          if (detectedSlug !== 'products') {
            params.append('pageSlug', detectedSlug)
          }
        }

        const url = `/api/breadcrumb-background?${params.toString()}`
        console.log('[PageHero] Fetching from:', url)
        
        const response = await fetch(url)
        console.log('[PageHero] Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('[PageHero] Response data:', data)
          if (data.setting) {
            console.log('[PageHero] Setting background:', data.setting)
            console.log('[PageHero] Fallback info:', data.debug)
            setBgSettings(data.setting)
          } else {
            console.log('[PageHero] No setting found in response')
          }
        } else {
          console.log('[PageHero] Response not OK:', await response.text())
        }
      } catch (error) {
        console.error('[PageHero] Error fetching breadcrumb background:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBreadcrumbBackground()
  }, [pathname, pageSlug, categoryId])

  // Use settings from database if available, otherwise fallback to prop
  const finalBgImage = bgSettings?.imageUrl || backgroundImage
  const finalMobileBg = bgSettings?.mobileImageUrl
  const finalOverlay = bgSettings?.overlayColor || 'rgba(26, 26, 46, 0.85), rgba(26, 58, 92, 0.85)'
  const finalTitle = bgSettings?.title || title
  const finalDescription = bgSettings?.subtitle || description

  return (
    <section 
      className="relative bg-gradient-to-br from-[#1a1a2e] via-[#1a3a5c] to-[#2a4a6c] overflow-hidden"
      style={finalBgImage ? {
        backgroundImage: `linear-gradient(${finalOverlay}), url(${finalBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {}}
    >
      <Container>
        <div className="py-8 md:py-12">
          {/* Breadcrumb Navigation */}
          {defaultBreadcrumbs.length > 0 && (
            <nav className="flex items-center space-x-2 text-sm mb-6" aria-label="Breadcrumb">
              <Link href="/" className="text-white/70 hover:text-white flex items-center transition-colors">
                <Home className="w-4 h-4" />
              </Link>
              {defaultBreadcrumbs.map((item, index) => (
                <div key={item.href} className="flex items-center space-x-2">
                  <ChevronRight className="w-4 h-4 text-white/40" />
                  {index === defaultBreadcrumbs.length - 1 ? (
                    <span className="text-[#c9a84c] font-medium">{item.name}</span>
                  ) : (
                    <Link href={item.href} className="text-white/70 hover:text-white transition-colors">
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          )}

          {/* Page Title */}
          <div className="text-white">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {finalTitle}
            </h1>
            {finalDescription && (
              <p className="text-lg md:text-xl text-white/80 max-w-3xl">
                {finalDescription}
              </p>
            )}
          </div>
        </div>
      </Container>

      {/* Decorative Elements */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#c9a84c]/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
    </section>
  )
}
