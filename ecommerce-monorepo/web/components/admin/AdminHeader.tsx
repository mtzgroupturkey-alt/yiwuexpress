'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Globe, ExternalLink, Bell } from 'lucide-react'
import { AdminUser } from '@/app/admin/contexts/AdminAuthContext'
import { ADMIN_NAV_ITEMS } from './AdminSidebar'

export interface AdminHeaderProps {
  companyName: string
  primaryColor: string
  accentColor: string
  user: AdminUser | null
  onOpenMobileMenu: () => void
  title?: string
}

export function AdminHeader({
  companyName,
  primaryColor,
  accentColor,
  user,
  onOpenMobileMenu,
  title,
}: AdminHeaderProps) {
  const pathname = usePathname()

  const pageTitle =
    title ||
    (pathname.startsWith('/admin/settings')
      ? 'Settings'
      : ADMIN_NAV_ITEMS.find((n) => n.href === pathname)?.label || 'Admin')

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      {/* Mobile hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">{pageTitle}</h2>
          <p className="text-xs text-gray-400 hidden sm:block">
            {companyName} Management Console
          </p>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* View Website (New Tab) */}
        <a
          href="/en"
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
          title="Open storefront in a new tab"
        >
          <Globe size={14} className="group-hover:rotate-12 transition-transform" />
          <span>View Website</span>
          <ExternalLink size={12} className="opacity-70 group-hover:opacity-100" />
        </a>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          title="Notifications"
        >
          <Bell size={18} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: accentColor }}
          />
        </button>

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
    </header>
  )
}
