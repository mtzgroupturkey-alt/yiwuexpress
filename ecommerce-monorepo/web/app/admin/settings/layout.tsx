'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Settings, Building2, Globe, Shield, Bell, Users2,
  Key, Database, Mail, Palette, FileText, Cog
} from 'lucide-react'

const settingsNavigation = [
  {
    name: 'Company Info',
    href: '/admin/settings/company',
    icon: Building2,
    description: 'Business details and contact information',
  },
  {
    name: 'System Settings',
    href: '/admin/settings/system',
    icon: Cog,
    description: 'General system configuration',
  },
  {
    name: 'User Permissions',
    href: '/admin/settings/permissions',
    icon: Shield,
    description: 'Role and access management',
  },
  {
    name: 'Notifications',
    href: '/admin/settings/notifications',
    icon: Bell,
    description: 'Email and system notifications',
  },
  {
    name: 'API Settings',
    href: '/admin/settings/api',
    icon: Key,
    description: 'API keys and integrations',
  },
  {
    name: 'Backup & Export',
    href: '/admin/settings/backup',
    icon: Database,
    description: 'Data backup and export options',
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Pages that should not show the sidebar navigation (shown as submenu in main sidebar)
  const directPages = [
    '/admin/settings/company', 
    '/admin/settings/permissions', 
    '/admin/settings/backup',
    '/admin/settings/notifications'
  ]
  const showSidebar = !directPages.includes(pathname)

  // If it's a direct page, just show the content without sidebar
  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Settings size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage system and company configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Configuration</h2>
            </div>
            <nav className="p-2">
              {settingsNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-gray-50 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 shadow-sm' 
                        : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      isActive 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <item.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="xl:col-span-3">
          {children}
        </div>
      </div>
    </div>
  )
}