'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { Container } from '@/components/ui/Container'

interface BreadcrumbItem {
  name: string
  href: string
}

interface BreadcrumbWithBackgroundProps {
  items: BreadcrumbItem[]
  backgroundImage?: string
  mobileImage?: string
  overlayColor?: string
  title?: string
  subtitle?: string
  categorySlug?: string
}

export function BreadcrumbWithBackground({
  items,
  backgroundImage,
  mobileImage,
  overlayColor = 'rgba(26,58,92,0.6)',
  title,
  subtitle,
}: BreadcrumbWithBackgroundProps) {
  return (
    <div className="relative overflow-hidden bg-[#1a3a5c]">
      {/* Background Image */}
      {backgroundImage && (
        <>
          <div className="absolute inset-0">
            {/* Desktop Image */}
            <img
              src={backgroundImage}
              alt="Breadcrumb background"
              className="hidden md:block w-full h-full object-cover"
            />
            {/* Mobile Image */}
            {mobileImage ? (
              <img
                src={mobileImage}
                alt="Breadcrumb background"
                className="md:hidden w-full h-full object-cover"
              />
            ) : (
              <img
                src={backgroundImage}
                alt="Breadcrumb background"
                className="md:hidden w-full h-full object-cover"
              />
            )}
          </div>
          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: overlayColor }}
          />
        </>
      )}

      <Container maxWidth="2xl" className="relative py-8 md:py-12 lg:py-16">
        <div className="text-white">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-white/80 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white flex items-center">
              <Home className="w-4 h-4" />
            </Link>
            {items.map((item, index) => (
              <div key={item.href} className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-white/40" />
                {index === items.length - 1 ? (
                  <span className="text-white font-medium">{item.name}</span>
                ) : (
                  <Link href={item.href} className="hover:text-white transition">
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Title & Subtitle */}
          {title && (
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-white/80 text-lg mt-2 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      </Container>
    </div>
  )
}
