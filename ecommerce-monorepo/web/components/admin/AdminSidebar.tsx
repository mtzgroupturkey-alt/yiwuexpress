'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, Package, FileText, Ship, Users,
  Settings, LogOut, Menu, X, ChevronRight, Globe,
  TrendingUp, ChevronDown, Eye, CheckCircle,
  MapPin, Building, Sliders, Mail, Shield, Database,
  ShoppingBag, ShoppingCart, MessageSquare, Plus, FolderTree, Tag, Image as ImageIcon,
  Building2, ClipboardList, DollarSign, Truck, Server, LucideIcon
} from 'lucide-react'

export interface AdminNavItem {
  href: string
  label: string
  icon: LucideIcon
  subItems?: AdminNavItem[]
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { 
    href: '/admin/products', 
    label: 'Products', 
    icon: ShoppingBag,
    subItems: [
      { href: '/admin/products', label: 'All Products', icon: Eye },
      { href: '/admin/products/new', label: 'Add Product', icon: Plus },
    ]
  },
  { 
    href: '/admin/categories', 
    label: 'Categories', 
    icon: FolderTree,
    subItems: [
      { href: '/admin/categories', label: 'All Categories', icon: Eye },
      { href: '/admin/categories/menu', label: 'Menu Manager', icon: Sliders },
    ]
  },
  { 
    href: '/admin/attributes', 
    label: 'Attributes', 
    icon: Tag,
  },
  { 
    href: '/admin/suppliers', 
    label: 'Suppliers', 
    icon: Building2,
  },
  { 
    href: '/admin/purchase-orders', 
    label: 'Purchase Orders', 
    icon: ClipboardList,
    subItems: [
      { href: '/admin/purchase-orders', label: 'All Purchase Orders', icon: Eye },
      { href: '/admin/purchase-orders/new', label: 'Create Purchase Order', icon: Plus },
    ]
  },
  { 
    href: '/admin/orders', 
    label: 'Sales Orders', 
    icon: ShoppingCart,
    subItems: [
      { href: '/admin/orders', label: 'All Orders', icon: Eye },
      { href: '/admin/orders?status=pending', label: 'Pending Orders', icon: CheckCircle },
    ]
  },
  { 
    href: '/admin/wholesale', 
    label: 'Wholesale', 
    icon: MessageSquare,
    subItems: [
      { href: '/admin/wholesale', label: 'All Inquiries', icon: Eye },
      { href: '/admin/wholesale?status=new', label: 'New Inquiries', icon: Plus },
    ]
  },
  { 
    href: '/admin/countries', 
    label: 'Countries', 
    icon: Globe,
    subItems: [
      { href: '/admin/countries', label: 'All Countries', icon: Eye },
      { href: '/admin/countries/new', label: 'Add Country', icon: Plus },
    ]
  },
  { 
    href: '/admin/currencies', 
    label: 'Currencies', 
    icon: DollarSign,
  },
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
      { href: '/admin/containers', label: 'Containers', icon: Package },
      { href: '/admin/shipments?tab=tracking', label: 'Tracking', icon: MapPin },
    ]
  },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { href: '/admin/testimonials', label: 'Testimonials', icon: ImageIcon },
  { 
    href: '/admin/settings', 
    label: 'Settings', 
    icon: Settings,
    subItems: [
      { href: '/admin/settings/general', label: 'General', icon: Settings },
      { href: '/admin/settings/hero-slider', label: 'Hero Slider', icon: Sliders },
      { href: '/admin/settings/featured-products', label: 'Featured Products', icon: ShoppingBag },
      { href: '/admin/settings/new-arrivals', label: 'New Arrivals', icon: Package },
      { href: '/admin/settings/flash-sales', label: 'Flash Sales', icon: TrendingUp },
      { href: '/admin/settings/breadcrumb', label: 'Breadcrumb Backgrounds', icon: Image as any },
      { href: '/admin/settings/company', label: 'Company Info', icon: Building },
      { href: '/admin/settings/contact-locations', label: 'Contact Locations', icon: MapPin },
      { href: '/admin/settings/system', label: 'System Settings', icon: Sliders },
      { href: '/admin/settings/shipping-methods', label: 'Shipping Methods', icon: Truck },
      { href: '/admin/settings/notifications', label: 'Notifications', icon: Mail },
      { href: '/admin/settings/permissions', label: 'Permissions', icon: Shield },
      { href: '/admin/settings/backup', label: 'Backup & Export', icon: Database },
      { href: '/admin/deploy/local', label: 'Local Deployment', icon: Server },
    ]
  },
]

export interface AdminSidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  logoUrl?: string
  companyName: string
  primaryColor: string
  accentColor: string
  onLogout: () => void
}

export function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
  logoUrl,
  companyName,
  primaryColor,
  accentColor,
  onLogout,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {}
    ADMIN_NAV_ITEMS.forEach(item => {
      if (item.subItems) {
        const isActive = item.subItems.some(sub => pathname.startsWith(sub.href))
        if (isActive) {
          initialExpanded[item.href] = true
        }
      }
    })
    setExpandedMenus(prev => ({ ...prev, ...initialExpanded }))
  }, [pathname])

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          ${sidebarOpen ? 'w-64' : 'w-20'} 
          flex-shrink-0 transition-all duration-300 ease-in-out
          fixed lg:static inset-y-0 left-0 z-50
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ 
          background: `linear-gradient(180deg, ${primaryColor}dd 0%, ${primaryColor} 60%, ${primaryColor}dd 100%)` 
        }}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 overflow-hidden relative">
                {logoUrl ? (
                  <Image 
                    src={logoUrl} 
                    alt="Logo" 
                    fill
                    sizes="32px"
                    className="object-contain"
                  />
                ) : (
                  <Globe size={16} className="text-white" />
                )}
              </div>
              <span className="text-white font-bold text-sm tracking-wider truncate max-w-[140px]">{companyName}</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors hidden lg:block"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
            aria-label="Close mobile menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Admin Panel Badge */}
        {sidebarOpen && (
          <div className="mx-4 mt-4 mb-2 px-3 py-1.5 rounded-lg text-center" style={{ background: `${accentColor}26`, border: `1px solid ${accentColor}4D` }}>
            <span className="text-xs font-semibold tracking-widest" style={{ color: accentColor }}>ADMIN PANEL</span>
          </div>
        )}

        {/* Nav Items List */}
        <nav className="mt-4 px-2 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {ADMIN_NAV_ITEMS.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isExpanded = expandedMenus[item.href]
            const isParentActive = (pathname.startsWith(item.href) && item.href !== '/admin') ||
              (item.subItems?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/')) ?? false)
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
                <Link
                  href={item.href}
                  onClick={toggleMenu}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                    isParentActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  style={isParentActive ? { background: `${accentColor}33`, border: `1px solid ${accentColor}4D` } : {}}
                >
                  <Icon 
                    size={20} 
                    className={isParentActive ? '' : 'group-hover:scale-110 transition-transform'} 
                    style={isParentActive ? { color: accentColor } : {}} 
                  />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 font-medium text-sm">{item.label}</span>
                      {hasSubItems ? (
                        <ChevronDown 
                          size={14} 
                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          style={isParentActive ? { color: accentColor } : {}} 
                        />
                      ) : (
                        isExactActive && <ChevronRight size={14} style={{ color: accentColor }} />
                      )}
                    </>
                  )}
                </Link>

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
                            style={isSubActive ? { color: accentColor } : {}} 
                          />
                          <span className="flex-1">{subItem.label}</span>
                          {isSubActive && (
                            <div 
                              className="w-1.5 h-1.5 rounded-full" 
                              style={{ background: accentColor }}
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

        {/* Bottom Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-white/10" style={{ width: sidebarOpen ? '16rem' : '5rem' }}>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all w-full text-left"
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
