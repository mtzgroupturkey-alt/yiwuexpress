'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, FileText, Ship, Users,
  Settings, LogOut, Menu, X, ChevronRight, Globe,
  TrendingUp, Bell
} from 'lucide-react'
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'
import ErrorBoundary from '@/components/ErrorBoundary'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/services', label: 'Services', icon: Package },
  { href: '/admin/quotes', label: 'Quotes', icon: FileText },
  { href: '/admin/shipments', label: 'Shipments', icon: Ship },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { isAdmin, loading } = useAdminAuth()
  const [logoUrl, setLogoUrl] = useState('')
  const [companyName, setCompanyName] = useState('YIWU EXPRESS')
  const pathname = usePathname()
  const router = useRouter()

  // Fix hydration issues by only rendering dynamic content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

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
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} flex-shrink-0 transition-all duration-300 ease-in-out`}
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
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Admin Badge */}
        {sidebarOpen && (
          <div className="mx-4 mt-4 mb-2 px-3 py-1.5 rounded-lg text-center" style={{ background: 'rgba(201, 168, 76, 0.15)', border: '1px solid rgba(201, 168, 76, 0.3)' }}>
            <span className="text-xs font-semibold tracking-widest" style={{ color: '#c9a84c' }}>ADMIN PANEL</span>
          </div>
        )}

        {/* Nav */}
        <nav className="mt-4 px-2 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href === '/admin/settings' && pathname.startsWith('/admin/settings'))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                  active
                    ? 'text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                style={active ? { background: 'rgba(201, 168, 76, 0.2)', border: '1px solid rgba(201, 168, 76, 0.3)' } : {}}
              >
                <Icon size={20} className={active ? '' : 'group-hover:scale-110 transition-transform'} style={active ? { color: '#c9a84c' } : {}} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 font-medium text-sm">{label}</span>
                    {active && <ChevronRight size={14} style={{ color: '#c9a84c' }} />}
                  </>
                )}
              </Link>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              {pathname.startsWith('/admin/settings') 
                ? 'Settings' 
                : navItems.find(n => n.href === pathname)?.label || 'Admin'}
            </h2>
            <p className="text-xs text-gray-400">YIWU EXPRESS Management Console</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#c9a84c' }}></span>
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #1a3a5c, #2563eb)' }}>A</div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-700">Admin</p>
                <p className="text-xs text-gray-400">admin@yiwuexpress.com</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
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
