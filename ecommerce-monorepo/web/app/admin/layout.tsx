'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'
import { AdminLocaleProvider } from './contexts/AdminLocaleContext'
import { Providers } from '@/components/providers'
import DynamicFavicon from '@/components/DynamicFavicon'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isAdmin, loading, user } = useAdminAuth()
  const [logoUrl, setLogoUrl] = useState('')
  const [faviconUrl, setFaviconUrl] = useState('')
  const [companyName, setCompanyName] = useState('Global Trade')
  const [primaryColor, setPrimaryColor] = useState('#1a3a5c')
  const [accentColor, setAccentColor] = useState('#c9a84c')
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem('admin_sidebar_open')
        if (savedState !== null) {
          setSidebarOpen(savedState === 'true')
          return
        }
      } catch (e) {
        console.error('Failed to read sidebar state from localStorage:', e)
      }

      // Default fallback by screen size: >= 1280px expanded, 1024-1279px collapsed icon rail
      if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }
  }, [])

  const handleToggleSidebar = (newStateOrUpdater: boolean | ((prev: boolean) => boolean)) => {
    setSidebarOpen((prev) => {
      const next = typeof newStateOrUpdater === 'function' ? newStateOrUpdater(prev) : newStateOrUpdater
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('admin_sidebar_open', String(next))
        } catch (e) {
          console.error('Failed to save sidebar state to localStorage:', e)
        }
      }
      return next
    })
  }

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (mounted) {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            if (data.settings.companyLogo) setLogoUrl(data.settings.companyLogo)
            if (data.settings.companyFavicon) setFaviconUrl(data.settings.companyFavicon)
            if (data.settings.companyName) setCompanyName(data.settings.companyName)
            if (data.settings.primaryColor) setPrimaryColor(data.settings.primaryColor)
            if (data.settings.accentColor) setAccentColor(data.settings.accentColor)
          }
        })
        .catch((err) => console.error('Failed to load admin settings:', err))
    }
  }, [mounted])

  // Apply theme colors as CSS custom properties
  useEffect(() => {
    if (mounted) {
      document.documentElement.style.setProperty('--primary-color', primaryColor)
      document.documentElement.style.setProperty('--accent-color', accentColor)
    }
  }, [mounted, primaryColor, accentColor])

  const handleLogout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/auth/login')
    }
  }

  // Hydration fallback
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin"
            style={{ borderTopColor: primaryColor }}
          />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin"
            style={{ borderTopColor: primaryColor }}
          />
          <p className="text-sm text-gray-500">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {faviconUrl && <DynamicFavicon faviconUrl={faviconUrl} />}

      {/* Extracted Admin Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={handleToggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        logoUrl={logoUrl}
        companyName={companyName}
        primaryColor={primaryColor}
        accentColor={accentColor}
        onLogout={handleLogout}
      />

      {/* Main Content Area - Dynamic flex-1 with min-w-0 prevents rightward viewport overflow */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Extracted Admin Header */}
        <AdminHeader
          companyName={companyName}
          primaryColor={primaryColor}
          accentColor={accentColor}
          user={user}
          sidebarOpen={sidebarOpen}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onToggleDesktopSidebar={() => handleToggleSidebar((prev) => !prev)}
        />

        {/* Page Content Slot - scrollable with min-w-0 and overflow-x-hidden */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AdminAuthProvider>
        <AdminLocaleProvider>
          <AdminLayoutContent>{children}</AdminLayoutContent>
        </AdminLocaleProvider>
      </AdminAuthProvider>
    </Providers>
  )
}
