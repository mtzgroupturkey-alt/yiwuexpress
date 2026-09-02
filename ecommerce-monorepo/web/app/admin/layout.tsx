'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'
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
  }, [])

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
        setSidebarOpen={setSidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        logoUrl={logoUrl}
        companyName={companyName}
        primaryColor={primaryColor}
        accentColor={accentColor}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        {/* Extracted Admin Header */}
        <AdminHeader
          companyName={companyName}
          primaryColor={primaryColor}
          accentColor={accentColor}
          user={user}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Page Content Slot */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AdminAuthProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminAuthProvider>
    </Providers>
  )
}
