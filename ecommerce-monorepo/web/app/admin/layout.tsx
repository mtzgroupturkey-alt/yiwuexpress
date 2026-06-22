'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, FileText, Ship, Users,
  Settings, LogOut, Menu, X, ChevronRight, Globe,
  TrendingUp, Bell, ChevronDown, Eye, CheckCircle,
  MapPin, Building, Sliders, Mail, Shield, Database
} from 'lucide-react'
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'
import ErrorBoundary from '@/components/ErrorBoundary'

interface NavItem {
  href: string
  label: string
  icon: any
  subItems?: NavItem[]
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/services', label: 'Services', icon: Package },
  { 
    href: '/admin/quotes', 
    label: 'Quotes', 
    icon: FileText,
    subItems: [
      { href: '/admin/quotes', label: 'View Quotes', icon: Eye },
      { href: '/admin/quotes?tab=pending', label: 'Approve/Reject', icon: CheckCircle },
    ]
  },
  { 
    href: '/admin/shipments', 
    label: 'Shipments', 
    icon: Ship,
    subItems: [
      { href: '/admin/shipments', label: 'All Shipments', icon: Ship },
      { href: '/admin/shipments?tab=tracking', label: 'Tracking', icon: MapPin },
    ]
  },
  { href: '/admin/users', label: 'Users', icon: Users },
  { 
    href: '/admin/settings', 
    label: 'Settings', 
    icon: Settings,
    subItems: [
      { href: '/admin/settings', label: 'General', icon: Sliders },
      { href: '/admin/settings/company', label: 'Company Info', icon: Building },
      { href: '/admin/settings/notifications', label: 'Notifications', icon: Mail },
      { href: '/admin/settings/permissions', label: 'Permissions', icon: Shield },
      { href: '/admin/settings/backup', label: 'Backup & Export', icon: Database },
    ]
  },
]

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isAdmin, loading } = useAdminAuth()
  const [logoUrl, setLogoUrl] = useState('')
  const [companyName, setCompanyName] = useState('YIWU EXPRESS')
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
  const pathname = usePathname()
  const router = useRouter()

  // Fix hydration issues by only rendering dynamic content after mount
  useEffect(() => {
    setMounted(true)
    
    // Auto-expand menus if current page is a submenu item
    const initialExpanded: Record<string, boolean> = {}
    navItems.forEach(item => {
      if (item.subItems) {
        const isActive = item.subItems.some(sub => pathname.startsWith(sub.href))
        if (isActive) {
          initialExpanded[item.href] = true
        }
      }
    })
    setExpandedMenus(initialExpanded)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

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
        .then(res => res.json())
        .then(data => {
          if (data.settings) {
            if (data.settings.companyLogo) setLogoUrl(data.settings.companyLogo)
            if (data.settings.companyName) setCompanyName(data.settings.companyName)
          }
        })
        .catch(err => console.error(err))
    }
  }, [mounted])

  const handleLogout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: try router push
      router.push('/auth/login')
    }
  }

  // Don't render anything until hydration is complete
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: Always visible, Mobile: Slide-in overlay */}
      <aside
        className={`
          ${sidebarOpen ? 'w-64' : 'w-20'} 
          flex-shrink-0 transition-all duration-300 ease-in-out
          fixed lg:static inset-y-0 left-0 z-50
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ background: 'linear-gradient(180deg, #0f2238 0%, #1a3a5c 60%, #0f2238 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Globe size={16} className="text-white" />
                )}
              </div>
              <span className="text-white font-bold text-sm tracking-wider">{companyName}</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors hidden lg:block"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          {/* Mobile close button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Admin Badge */}
        {sidebarOpen && (
          <div className="mx-4 mt-4 mb-2 px-3 py-1.5 rounded-lg text-center" style={{ background: 'rgba(201, 168, 76, 0.15)', border: '1px solid rgba(201, 168, 76, 0.3)' }}>
            <span className="text-xs font-semibold tracking-widest" style={{ color: '#c9a84c' }}>ADMIN PANEL</span>
          </div>
        )}

        {/* Nav */}
        <nav className="mt-4 px-2 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {navItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isExpanded = expandedMenus[item.href]
            const isParentActive = pathname.startsWith(item.href) && item.href !== '/admin'
            const isExactActive = pathname === item.href
            const Icon = item.icon

            const toggleMenu = (e: React.MouseEvent) => {
              if (hasSubItems) {
                e.preventDefault()
                setExpandedMenus(prev => ({
                  ...prev,
                  [item.href]: !prev[item.href]
                }))
              }
            }

            return (
              <div key={item.href}>
                {/* Parent Menu Item */}
                <Link
                  href={item.href}
                  onClick={toggleMenu}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                    isParentActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  style={isParentActive ? { background: 'rgba(201, 168, 76, 0.2)', border: '1px solid rgba(201, 168, 76, 0.3)' } : {}}
                >
                  <Icon 
                    size={20} 
                    className={isParentActive ? '' : 'group-hover:scale-110 transition-transform'} 
                    style={isParentActive ? { color: '#c9a84c' } : {}} 
                  />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 font-medium text-sm">{item.label}</span>
                      {hasSubItems ? (
                        <ChevronDown 
                          size={14} 
                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          style={isParentActive ? { color: '#c9a84c' } : {}} 
                        />
                      ) : (
                        isExactActive && <ChevronRight size={14} style={{ color: '#c9a84c' }} />
                      )}
                    </>
                  )}
                </Link>

                {/* Submenu Items */}
                {hasSubItems && isExpanded && sidebarOpen && (
                  <div className="mt-1 ml-3 pl-6 border-l border-white/10 space-y-1">
                    {item.subItems!.map((subItem) => {
                      const SubIcon = subItem.icon
                      const isSubActive = pathname === subItem.href || 
                                         (subItem.href.includes('?') && pathname === subItem.href.split('?')[0])
                      
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs ${
                            isSubActive
                              ? 'text-white bg-white/10'
                              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                          }`}
                        >
                          <SubIcon 
                            size={14} 
                            style={isSubActive ? { color: '#c9a84c' } : {}} 
                          />
                          <span className="flex-1">{subItem.label}</span>
                          {isSubActive && (
                            <div 
                              className="w-1.5 h-1.5 rounded-full" 
                              style={{ background: '#c9a84c' }}
                            />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-white/10" style={{ width: sidebarOpen ? '16rem' : '5rem' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all w-full text-left"
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          {/* Mobile hamburger + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                {pathname.startsWith('/admin/settings') 
                  ? 'Settings' 
                  : navItems.find(n => n.href === pathname)?.label || 'Admin'}
              </h2>
              <p className="text-xs text-gray-400 hidden sm:block">YIWU EXPRESS Management Console</p>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#c9a84c' }}></span>
            </button>
            <div className="flex items-center gap-2 pl-2 lg:pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #1a3a5c, #2563eb)' }}>A</div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-700">Admin</p>
                <p className="text-xs text-gray-400">admin@yiwuexpress.com</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  )
}
