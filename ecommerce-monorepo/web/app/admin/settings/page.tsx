'use client'

import React from 'react'
import Link from 'next/link'
import {
  Building, Building2, MapPin, Sliders, Truck, Mail, Shield, Database,
  KeyRound, Server, ShoppingBag, TrendingUp, Package, Image as ImageIcon,
  ArrowRight, Settings as SettingsIcon, Sparkles
} from 'lucide-react'
import { useAdminLocale } from '../contexts/AdminLocaleContext'
import { useSettings } from '@/components/SettingsProvider'

export default function AdminSettingsHubPage() {
  const { dict } = useAdminLocale()
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'

  const sections = [
    {
      title: dict.nav.groupCommerce,
      description: 'Customer-facing homepage banners, featured products, and promotional rails',
      items: [
        {
          href: '/admin/settings/hero-slider',
          title: dict.nav.heroSlider,
          desc: 'Main homepage visual carousel and promotional slides',
          icon: Sliders,
          color: 'from-amber-500 to-orange-600',
        },
        {
          href: '/admin/settings/featured-products',
          title: dict.nav.featuredProducts,
          desc: 'Curated products showcased prominently on the storefront',
          icon: ShoppingBag,
          color: 'from-blue-600 to-indigo-600',
        },
        {
          href: '/admin/settings/new-arrivals',
          title: dict.nav.newArrivals,
          desc: 'Latest catalog arrivals and spotlighted inventory',
          icon: Package,
          color: 'from-purple-600 to-violet-700',
        },
        {
          href: '/admin/settings/flash-sales',
          title: dict.nav.flashSales,
          desc: 'Time-limited discounted deals and countdown timers',
          icon: TrendingUp,
          color: 'from-rose-500 to-red-600',
        },
        {
          href: '/admin/settings/breadcrumb',
          title: dict.nav.breadcrumb,
          desc: 'Background hero banners across category and product pages',
          icon: ImageIcon,
          color: 'from-cyan-600 to-blue-700',
        },
      ],
    },
    {
      title: dict.nav.groupLogistics,
      description: 'Corporate profile, regional offices, and global shipping policies',
      items: [
        {
          href: '/admin/settings/company',
          title: dict.nav.company,
          desc: 'Brand name, logos, legal details, and primary colors',
          icon: Building,
          color: 'from-[#1a3a5c] to-[#2563eb]',
        },
        {
          href: '/admin/settings/warehouses',
          title: dict.nav.warehouses || 'Warehouses & 3D Layout',
          desc: 'Register fulfillment hubs, configure 2D racks/tiers/slots, and interactive 3D layout',
          icon: Building2,
          color: 'from-amber-600 to-orange-700',
        },
        {
          href: '/admin/settings/contact-locations',
          title: dict.nav.contactLocations,
          desc: 'Worldwide offices, warehouses, and contact channels',
          icon: MapPin,
          color: 'from-emerald-600 to-teal-700',
        },
        {
          href: '/admin/settings/shipping-methods',
          title: dict.nav.shippingMethods,
          desc: 'Ocean freight, air express, port tariffs, and forwarder rules',
          icon: Truck,
          color: 'from-indigo-600 to-blue-700',
        },
      ],
    },
    {
      title: dict.nav.groupSettings,
      description: 'Core runtime settings, role access controls, notification emails, and APIs',
      items: [
        {
          href: '/admin/settings/general',
          title: dict.nav.general,
          desc: 'Global platform settings, store mode (Wholesale/Retail/Hybrid)',
          icon: SettingsIcon,
          color: 'from-slate-700 to-slate-900',
        },
        {
          href: '/admin/settings/system',
          title: dict.nav.system,
          desc: 'Platform operational parameters, cache controls, and maintenance',
          icon: Sliders,
          color: 'from-teal-600 to-emerald-700',
        },
        {
          href: '/admin/settings/notifications',
          title: dict.nav.notifications,
          desc: 'In-app notification triggers and administrative alert subscriptions',
          icon: Mail,
          color: 'from-sky-600 to-blue-700',
        },
        {
          href: '/admin/settings/permissions',
          title: dict.nav.permissions,
          desc: 'Granular access control roles and team member permissions',
          icon: Shield,
          color: 'from-violet-600 to-purple-800',
        },
        {
          href: '/admin/settings/email-templates',
          title: dict.nav.emailTemplates,
          desc: 'Multilingual email copy for invoices, quote confirmations, and receipts',
          icon: Mail,
          color: 'from-amber-600 to-yellow-700',
        },
        {
          href: '/admin/settings/api',
          title: dict.nav.apiKeys,
          desc: 'Secure API credentials, webhooks, and third-party integrations',
          icon: KeyRound,
          color: 'from-emerald-700 to-green-800',
        },
        {
          href: '/admin/settings/backup',
          title: dict.nav.backup,
          desc: 'Database snapshots, configuration archives, and manual data exports',
          icon: Database,
          color: 'from-blue-700 to-indigo-900',
        },
        {
          href: '/admin/deployment',
          title: dict.nav.deployment || 'Deployment',
          desc: 'Production & local deployment orchestrator, server status monitoring, logs, and rollback controls',
          icon: Server,
          color: 'from-stone-700 to-slate-800',
        },
      ],
    },
  ]

  return (
    <div className="space-y-8 pb-14">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {dict.settings.title}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#1a3a5c]/10 text-[#1a3a5c] rounded-full">
              {companyName}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {dict.settings.subtitle}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700">
          <Sparkles size={14} className="text-[#c9a84c]" />
          <span>{dict.header.console}</span>
        </div>
      </div>

      {/* Grouped Category Sections */}
      <div className="space-y-8">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-3.5">
            <div className="border-b border-gray-200/80 pb-2">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                {section.title}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {section.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                          <Icon size={19} />
                        </div>
                        <ArrowRight size={14} className="text-gray-300 group-hover:text-[#1a3a5c] group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#1a3a5c] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] font-semibold text-gray-500 group-hover:text-[#1a3a5c] transition-colors">
                      <span>{dict.common.manage}</span>
                      <span className="font-mono text-[10px] text-gray-300">→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}