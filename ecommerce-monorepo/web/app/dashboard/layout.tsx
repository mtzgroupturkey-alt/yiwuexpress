'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { TwoRowNavbar } from '@/components/layout/TwoRowNavbar'
import Footer from '@/components/footer'
import { PageHero } from '@/components/layout/PageHero'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth()
  const hasCheckedAuth = useRef(false)

  // Only check auth once on mount
  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true
      checkAuth()
    }
  }, [checkAuth])

  // Redirect if not authenticated (only after loading completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard')
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div 
            className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" 
            style={{ borderTopColor: '#1a3a5c' }}
          ></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Build breadcrumb items from current path
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/dashboard'
  const pathSegments = currentPath.split('/').filter(Boolean)
  
  const breadcrumbs = [{ name: 'Home', href: '/' }]
  let accumulatedPath = ''
  
  for (const segment of pathSegments) {
    accumulatedPath += `/${segment}`
    const name = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    breadcrumbs.push({ name, href: accumulatedPath })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative w-full overflow-x-hidden">
      {/* Header with Top Bar + Main Header + Mega Menu */}
      <TwoRowNavbar />
      
      {/* Breadcrumb Section */}
      <PageHero
        pageTitle={`Welcome back, ${user?.name || 'User'}!`}
        pageDescription="Manage your orders, wishlist, profile and account settings"
        breadcrumbs={breadcrumbs}
      />
      
      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}
