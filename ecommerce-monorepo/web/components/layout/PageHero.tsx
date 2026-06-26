'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { Container } from '@/components/ui/Container'

interface BreadcrumbItem {
  name: string
  href: string
}

interface PageHeroProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  backgroundImage?: string
}

export function PageHero({ title, description, breadcrumbs, backgroundImage }: PageHeroProps) {
  const defaultBreadcrumbs: BreadcrumbItem[] = breadcrumbs || []

  return (
    <section 
      className="relative bg-gradient-to-br from-[#1a1a2e] via-[#1a3a5c] to-[#2a4a6c] overflow-hidden"
      style={backgroundImage ? {
        backgroundImage: `linear-gradient(rgba(26, 26, 46, 0.85), rgba(26, 58, 92, 0.85)), url(${backgroundImage})`,
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
              {title}
            </h1>
            {description && (
              <p className="text-lg md:text-xl text-white/80 max-w-3xl">
                {description}
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
