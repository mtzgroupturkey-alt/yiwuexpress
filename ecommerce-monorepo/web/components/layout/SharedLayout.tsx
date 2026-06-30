'use client'

import { TopBar } from './TopBar'
import { MainHeader } from './MainHeader'
import { CategoryMenu } from './CategoryMenu'
import { HeroSlider } from '@/components/home/HeroSlider'
import { PageHero } from './PageHero'
import Footer from '@/components/footer'

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
}

export function SharedLayout({ 
  children, 
  showHero = false,
  pageTitle,
  pageDescription,
  breadcrumbs,
  backgroundImage,
  categoryId
}: SharedLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative w-full overflow-x-hidden">
      {/* Top Bar - Always visible */}
      <TopBar />
      
      {/* Main Header - Always visible */}
      <MainHeader />
      
      {/* Category Menu - Always visible */}
      <CategoryMenu />
      
      {/* Hero Section - Only on homepage */}
      {showHero && <HeroSlider />}
      
      {/* Page Hero with Breadcrumbs - Only on other pages */}
      {!showHero && pageTitle && (
        <PageHero 
          title={pageTitle}
          description={pageDescription}
          breadcrumbs={breadcrumbs}
          backgroundImage={backgroundImage}
          categoryId={categoryId}
        />
      )}
      
      {/* Main Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer - Always visible */}
      <Footer />
    </div>
  )
}
