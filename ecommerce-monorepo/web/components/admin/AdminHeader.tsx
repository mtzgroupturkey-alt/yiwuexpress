import React, { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Menu, Globe, ExternalLink, Bell, ChevronDown, Check,
  AlertTriangle, FileText, ShoppingCart, ArrowRight, Search,
  Command, Sparkles, LayoutDashboard, ShoppingBag, DollarSign,
  Package, Sliders, Settings, Users, Truck, Building2, X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AdminUser } from '@/app/admin/contexts/AdminAuthContext'
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext'
import { ADMIN_NAV_ITEMS } from './AdminSidebar'
import { QuickActions } from './QuickActions'

export interface AdminHeaderProps {
  companyName: string
  primaryColor: string
  accentColor: string
  user: AdminUser | null
  onOpenMobileMenu: () => void
  onToggleDesktopSidebar?: () => void
  sidebarOpen?: boolean
  title?: string
}

export function AdminHeader({
  companyName,
  primaryColor,
  accentColor,
  user,
  onOpenMobileMenu,
  onToggleDesktopSidebar,
  sidebarOpen = true,
  title,
}: AdminHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { locale, setLocale, dict, supportedLocales, t } = useAdminLocale()
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [cmdSearch, setCmdSearch] = useState('')
  const [notifCounts, setNotifCounts] = useState({
    pendingQuotes: 0,
    pendingOrders: 0,
    lowStock: 0,
  })
  const langMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const cmdInputRef = useRef<HTMLInputElement>(null)

  // Listen for Ctrl+K, Cmd+K, and Ctrl+N
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen((prev) => !prev)
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault()
        router.push('/admin/products/new')
      } else if (e.key === 'Escape') {
        setCmdOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  useEffect(() => {
    if (cmdOpen) {
      setTimeout(() => cmdInputRef.current?.focus(), 50)
    } else {
      setCmdSearch('')
    }
  }, [cmdOpen])

  // Fetch real-time pending notification counts
  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success || data.pendingQuotes !== undefined) {
          const quotes = data.pendingQuotes ?? data.data?.overview?.pendingQuotes ?? 0
          const lowStock = data.lowStockProducts ?? data.data?.overview?.lowStockProducts ?? 0
          const pendingOrdersItem = (data.ordersByStatus || data.data?.ordersByStatus || []).find((s: any) => s.status === 'PENDING')
          const pendingOrders = pendingOrdersItem ? pendingOrdersItem.count || pendingOrdersItem._count || 0 : 0

          setNotifCounts({
            pendingQuotes: quotes,
            pendingOrders,
            lowStock,
          })
        }
      })
      .catch((err) => console.error('Error fetching notifs:', err))
  }, [pathname])

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (langMenuOpen || notifOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [langMenuOpen, notifOpen])

  // Get current active locale config
  const currentLocaleOption =
    supportedLocales.find((l) => l.code === locale) || supportedLocales[0]

  // Dynamic translated page title
  let pageTitle = title
  if (!pageTitle) {
    if (pathname === '/admin') {
      pageTitle = dict.nav.dashboard
    } else if (pathname.startsWith('/admin/settings')) {
      pageTitle = dict.nav.settings
    } else {
      const matched = ADMIN_NAV_ITEMS.find((n) => n.href === pathname)
      if (matched) {
        // Find corresponding key in dict.nav
        pageTitle = (dict.nav as any)[matched.key || ''] || matched.label
      } else {
        pageTitle = 'Admin'
      }
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 relative z-30">
      {/* Mobile hamburger & Desktop toggle + Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {onToggleDesktopSidebar && (
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label="Toggle sidebar"
          >
            <Menu size={19} />
          </button>
        )}

        <div>
          <h2 className="text-sm font-semibold text-gray-800">{pageTitle}</h2>
          <p className="text-xs text-gray-400 hidden sm:block">
            {companyName} {dict.header.console}
          </p>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Quick Actions Dropdown */}
        <QuickActions />

        {/* Command Palette Trigger Button */}
        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 bg-gray-50/80 hover:bg-gray-100 text-gray-600 transition-all duration-150 shadow-xs hover:border-gray-300"
          title={dict.commandPalette?.pressK || 'Search (Ctrl+K)'}
        >
          <Search size={14} className="text-gray-400" />
          <span className="hidden md:inline text-gray-500">
            {dict.common.search || 'Search...'}
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-200/70 border border-gray-300/80 text-[10px] font-semibold text-gray-500 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Language Switcher Dropdown */}
        <div className="relative" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-gray-200 bg-gray-50/80 hover:bg-gray-100 text-gray-700 transition-all duration-150 shadow-xs hover:border-gray-300"
            title={dict.header.switchLanguage}
          >
            <span className="text-sm">{currentLocaleOption.flag}</span>
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {currentLocaleOption.code}
            </span>
            <span className="hidden md:inline text-gray-500 font-normal">
              {currentLocaleOption.nativeName}
            </span>
            <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-50">
                {dict.header.switchLanguage}
              </div>
              {supportedLocales.map((item) => {
                const isSelected = item.code === locale
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLocale(item.code)
                      setLangMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.flag}</span>
                      <div className="flex flex-col">
                        <span>{item.nativeName}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-normal">{item.label}</span>
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-blue-600" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* View Website (New Tab) */}
        <a
          href={`/${locale}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 shadow-xs hover:shadow-sm group"
          style={{
            color: primaryColor,
            borderColor: `${primaryColor}30`,
            backgroundColor: `${primaryColor}08`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = primaryColor
            e.currentTarget.style.color = '#fff'
            e.currentTarget.style.borderColor = primaryColor
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${primaryColor}08`
            e.currentTarget.style.color = primaryColor
            e.currentTarget.style.borderColor = `${primaryColor}30`
          }}
          title={dict.header.viewWebsite}
        >
          <Globe size={14} className="group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">{dict.header.viewWebsite}</span>
          <ExternalLink size={12} className="opacity-70 group-hover:opacity-100" />
        </a>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          {(() => {
            const totalActionItems =
              notifCounts.pendingQuotes + notifCounts.pendingOrders + notifCounts.lowStock

            return (
              <>
                <button
                  type="button"
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  title={dict.header.notifications}
                >
                  <Bell size={18} />
                  {totalActionItems > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black text-white flex items-center justify-center animate-pulse"
                      style={{ background: accentColor }}
                    >
                      {totalActionItems > 99 ? '99+' : totalActionItems}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="flex items-center justify-between px-4 pb-2.5 border-b border-gray-100">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{dict.header.notifications}</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">{dict.header.pendingActionItems}</p>
                      </div>
                      {totalActionItems > 0 && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ background: accentColor }}
                        >
                          {totalActionItems} {dict.orders.totalSuffix}
                        </span>
                      )}
                    </div>

                    <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                      {totalActionItems === 0 ? (
                        <div className="py-8 px-4 text-center">
                          <Check className="w-8 h-8 mx-auto text-emerald-500 mb-1.5 opacity-80" />
                          <p className="text-xs font-semibold text-gray-800">{dict.header.noNotifications}</p>
                        </div>
                      ) : (
                        <>
                          {/* Pending Orders Notification */}
                          {notifCounts.pendingOrders > 0 && (
                            <Link
                              href="/admin/orders"
                              onClick={() => setNotifOpen(false)}
                              className="flex items-start gap-3 p-3.5 hover:bg-blue-50/40 transition-colors group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                                <ShoppingCart size={15} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {dict.header.pendingOrdersCount}
                                  </p>
                                  <span className="text-[11px] font-mono font-bold text-blue-600">
                                    {notifCounts.pendingOrders}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {dict.orders.subtitle}
                                </p>
                              </div>
                              <ArrowRight size={13} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all mt-1" />
                            </Link>
                          )}

                          {/* Pending Quotes Notification */}
                          {notifCounts.pendingQuotes > 0 && (
                            <Link
                              href="/admin/quotes"
                              onClick={() => setNotifOpen(false)}
                              className="flex items-start gap-3 p-3.5 hover:bg-amber-50/40 transition-colors group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                                <FileText size={15} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                                    {dict.header.pendingQuotesCount}
                                  </p>
                                  <span className="text-[11px] font-mono font-bold text-amber-600">
                                    {notifCounts.pendingQuotes}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {dict.quotes.subtitle}
                                </p>
                              </div>
                              <ArrowRight size={13} className="text-gray-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all mt-1" />
                            </Link>
                          )}

                          {/* Low Stock Notification */}
                          {notifCounts.lowStock > 0 && (
                            <Link
                              href="/admin/products"
                              onClick={() => setNotifOpen(false)}
                              className="flex items-start gap-3 p-3.5 hover:bg-red-50/40 transition-colors group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                                <AlertTriangle size={15} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                                    {dict.header.lowStockCount}
                                  </p>
                                  <span className="text-[11px] font-mono font-bold text-red-600">
                                    {notifCounts.lowStock}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {dict.dashboard.lowStock}
                                </p>
                              </div>
                              <ArrowRight size={13} className="text-gray-300 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all mt-1" />
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 lg:pl-3 border-l border-gray-200">
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user.name || user.email}
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, #2563eb)` }}
            >
              {(user?.name?.[0] || user?.email?.[0] || 'A').toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-800 leading-tight">
              {user?.name || user?.email?.split('@')[0] || 'Admin'}
            </p>
            <p className="text-[11px] text-gray-400 leading-tight">
              {user?.email || 'admin@globaltrade.com'}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Command Palette Modal (Ctrl+K) */}
      {cmdOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-in fade-in-50 duration-150"
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Command search input bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-gray-100 gap-3 bg-gray-50/50">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                ref={cmdInputRef}
                type="text"
                value={cmdSearch}
                onChange={(e) => setCmdSearch(e.target.value)}
                placeholder={dict.commandPalette?.searchPlaceholder || 'Type a command, page, or search...'}
                className="w-full text-sm bg-transparent outline-hidden text-gray-900 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setCmdOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Command items list */}
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
              {/* Quick Actions */}
              <div>
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {dict.commandPalette?.quickActions || 'Quick Actions'}
                </div>
                <div className="space-y-0.5 mt-1">
                  {[
                    {
                      label: dict.commandPalette?.createProduct || 'Create New Product',
                      href: '/admin/products/new',
                      icon: Package,
                    },
                    {
                      label: dict.commandPalette?.createPO || 'Create Purchase Order',
                      href: '/admin/purchase-orders/new',
                      icon: FileText,
                    },
                    {
                      label: dict.commandPalette?.viewFinance || 'Open Financial Ledger',
                      href: '/admin/finance',
                      icon: DollarSign,
                    },
                  ]
                    .filter((item) =>
                      !cmdSearch ||
                      item.label.toLowerCase().includes(cmdSearch.toLowerCase()) ||
                      item.href.toLowerCase().includes(cmdSearch.toLowerCase())
                    )
                    .map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() => {
                            setCmdOpen(false)
                            router.push(item.href)
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-blue-50/70 text-gray-700 hover:text-blue-700 text-xs font-medium transition-colors text-left group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-blue-100/60 text-gray-500 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                              <Icon size={14} />
                            </div>
                            <span>{item.label}</span>
                          </div>
                          <ArrowRight size={13} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      )
                    })}
                </div>
              </div>

              {/* Navigation Items */}
              <div>
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {dict.commandPalette?.quickJump || 'Navigation'}
                </div>
                <div className="space-y-0.5 mt-1">
                  {ADMIN_NAV_ITEMS.filter((item) => {
                    const label = (dict.nav as any)[item.key || ''] || item.label
                    return (
                      !cmdSearch ||
                      label.toLowerCase().includes(cmdSearch.toLowerCase()) ||
                      item.href.toLowerCase().includes(cmdSearch.toLowerCase())
                    )
                  }).map((item) => {
                    const Icon = item.icon
                    const label = (dict.nav as any)[item.key || ''] || item.label
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => {
                          setCmdOpen(false)
                          router.push(item.href)
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-100 text-gray-700 hover:text-gray-900 text-xs font-medium transition-colors text-left group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-gray-200/80 text-gray-500 group-hover:text-gray-800 flex items-center justify-center shrink-0 transition-colors">
                            <Icon size={14} />
                          </div>
                          <span>{label}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono group-hover:text-gray-600">
                          {item.href}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer keyboard hints */}
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span>{dict.commandPalette?.pressEsc || 'Press ESC to close'}</span>
              <span className="font-mono text-gray-500">Ctrl+K / ⌘K</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
