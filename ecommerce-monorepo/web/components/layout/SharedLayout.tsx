'use client'

import { Design3LayoutHeader } from './Design3LayoutHeader'
import { Design3LayoutFooter } from './Design3LayoutFooter'
import { PageHero } from './PageHero'
import { BackToTop } from '@/components/ui/BackToTop'

interface BreadcrumbItem {
  name: string
  href: string
}

interface SharedLayoutProps {
  children: React.ReactNode
  showHero?: boolean
  pageTitle?: string
  pageDescription?: string
  breadcrumbs?: BreadcrumbItem[]
  backgroundImage?: string
  categoryId?: string
  pageSlug?: string
  overlayColor?: string
}

export function SharedLayout({ 
  children, 
  showHero = false,
  pageTitle,
  pageDescription,
  breadcrumbs,
  backgroundImage,
  categoryId,
  pageSlug,
  overlayColor
}: SharedLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative w-full overflow-x-hidden">
      {/* Design-3 Modern Header & Interactive Modals */}
      <Design3LayoutHeader />
      
      {/* Page Hero with Breadcrumbs - Only on other pages */}
      {!showHero && pageTitle && (
        <PageHero 
          title={pageTitle}
          description={pageDescription}
          breadcrumbs={breadcrumbs}
          backgroundImage={backgroundImage}
          overlayColor={overlayColor}
          categoryId={categoryId}
          pageSlug={pageSlug}
        />
      )}
      
      {/* Main Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Design-3 Modern Footer */}
      <Design3LayoutFooter />

      {/* Floating Back to Top Button */}
      <BackToTop />
    </div>
  )
}
