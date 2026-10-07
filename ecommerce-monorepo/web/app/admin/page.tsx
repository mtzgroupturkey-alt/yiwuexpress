'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileText, Ship, DollarSign, Clock, ArrowRight, Globe, CheckCircle,
  AlertCircle, RefreshCw, ShoppingBag, ShoppingCart, MessageSquare, Plus,
  ShieldCheck, Activity, Layers, ArrowUpRight, Sparkles, ExternalLink,
  Truck, Box, ArrowDownRight, Users
} from 'lucide-react'
import { useAdminAuth } from './contexts/AdminAuthContext'
import { useAdminLocale } from './contexts/AdminLocaleContext'
import { useSettings } from '@/components/SettingsProvider'

interface Stats {
  totalUsers?: number
  totalOrders?: number
  totalProducts?: number
  totalServices?: number
  totalQuotes?: number
  totalShipments?: number
  totalWholesaleInquiries?: number
  totalRevenue?: number
  thisMonthRevenue?: number
  pendingQuotes?: number
  activeShipments?: number
  lowStockProducts?: number
  recentQuotes?: any[]
  recentShipments?: any[]
  recentOrders?: any[]
  data?: {
    overview?: {
      totalUsers: number
      totalOrders: number
      totalProducts: number
      totalServices: number
      totalQuotes: number
      totalShipments: number
      totalWholesaleInquiries: number
      revenue: number
      pendingQuotes: number
      activeShipments: number
      lowStockProducts: number
    }
    ordersByStatus?: any[]
    wholesaleByStatus?: any[]
    recentOrders?: any[]
    recentQuotes?: any[]
    recentShipments?: any[]
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  subtext,
  href,
  manageLabel = 'Manage'
}: {
  label: string
  value: string | number
  icon: React.ElementType
  iconBg: string
  iconColor: string
  subtext?: string
  href?: string
  manageLabel?: string
}) {
  const content = (
    <div className="group bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate" title={label}>
            {label}
          </p>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconColor} transition-transform group-hover:scale-105`}>
            <Icon size={16} />
          </div>
        </div>

        <div className="mt-2">
          <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight tabular-nums truncate" title={String(value)}>
            {value}
          </p>
          {subtext && (
            <p className="text-[11px] text-slate-500 mt-1 font-medium truncate" title={subtext}>
              {subtext}
            </p>
          )}
        </div>
      </div>

      {href && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600 group-hover:text-[#1a3a5c] transition-colors">
          <span>{manageLabel}</span>
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </div>
  )

  return href ? <Link href={href} className="block h-full">{content}</Link> : content
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const styles: Record<string, string> = {
    // Pending states
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200/70',
    PAYMENT_PENDING: 'bg-amber-50 text-amber-700 border-amber-200/70',
    NEW: 'bg-blue-50 text-blue-700 border-blue-200/70',
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',

    // Active / In transit states
    PROCESSING: 'bg-purple-50 text-purple-700 border-purple-200/70',
    SHIPPED: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
    IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200/70',
    AT_CUSTOMS: 'bg-orange-50 text-orange-700 border-orange-200/70',
    CUSTOMS_HOLD: 'bg-rose-50 text-rose-700 border-rose-200/70',
    CONTACTED: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',

    // Completed states
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    COMPLETED: 'bg-teal-50 text-teal-700 border-teal-200/70',
    CUSTOMS_CLEARED: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',

    // Failed / Cancelled
    REJECTED: 'bg-red-50 text-red-700 border-red-200/70',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200/70',
    REFUNDED: 'bg-rose-50 text-rose-700 border-rose-200/70',
  }

  const formatText = label || status?.replace(/_/g, ' ') || 'Unknown'

  return (
    <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md border tracking-wide whitespace-nowrap ${styles[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {formatText}
    </span>
  )
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [activityTab, setActivityTab] = useState<'orders' | 'shipments' | 'quotes'>('orders')
  const { isAdmin, user } = useAdminAuth()
  const { settings, storeMode } = useSettings()
  const { locale, dict, t } = useAdminLocale()

  const companyName = settings?.companyName || 'Global Trade'

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/admin/stats', {
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        setStats(data)
        setError('')
      } else {
        setError(data.error || 'Failed to load statistics')
      }
    } catch {
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    fetchStats()
  }, [isAdmin])

  // Computed values
  const overview: any = stats?.data?.overview || stats
  const totalRev = Number(stats?.totalRevenue ?? overview?.revenue ?? 0)
  const totalOrders = stats?.totalOrders ?? overview?.totalOrders ?? 0
  const totalProducts = stats?.totalProducts ?? overview?.totalProducts ?? 0
  const totalQuotes = stats?.totalQuotes ?? overview?.totalQuotes ?? 0
  const totalShipments = stats?.totalShipments ?? overview?.totalShipments ?? 0
  const totalInquiries = stats?.totalWholesaleInquiries ?? overview?.totalWholesaleInquiries ?? 0
  const totalUsers = stats?.totalUsers ?? overview?.totalUsers ?? 0
  const pendingQuotes = stats?.pendingQuotes ?? overview?.pendingQuotes ?? 0
  const activeShipments = stats?.activeShipments ?? overview?.activeShipments ?? 0
  const lowStock = stats?.lowStockProducts ?? overview?.lowStockProducts ?? 0

  const recentOrders = stats?.recentOrders || stats?.data?.recentOrders || []
  const recentShipments = stats?.recentShipments || stats?.data?.recentShipments || []
  const recentQuotes = stats?.recentQuotes || stats?.data?.recentQuotes || []

  const headerTitle = settings?.siteTagline
    ? `${companyName} · ${settings.siteTagline}`
    : `${companyName} ${dict.nav.dashboard}`

  const userCleanName = user?.name && !user.name.toLowerCase().includes('yiwu')
    ? user.name
    : user?.email?.split('@')[0] || 'Administrator'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-[#1a3a5c] rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">{dict.common.loading}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center gap-3 text-rose-600 bg-rose-50/80 p-5 rounded-xl border border-rose-100 max-w-sm text-center">
          <AlertCircle size={28} />
          <p className="font-semibold text-xs">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-1 px-3 py-1.5 bg-[#1a3a5c] text-white text-xs font-medium rounded-lg hover:bg-[#0d2a4a] transition"
          >
            {dict.common.refresh}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-8 max-w-full">
      {/* Top Executive Header Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-semibold">
              <Sparkles size={11} className="text-amber-600" />
              <span>{dict.header.console}</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-medium text-slate-500">
              {companyName} {dict.dashboard.subtitle}
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-1">
            {headerTitle}
          </h1>
          {userCleanName && (
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {dict.header.profile}: <span className="text-slate-700 font-semibold">{userCleanName}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition shadow-xs active:scale-95 disabled:opacity-50"
            title={dict.common.refresh}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-slate-500' : 'text-slate-500'} />
            <span>{refreshing ? dict.common.loading : dict.common.refresh}</span>
          </button>

          <Link
            href={`/${locale}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition shadow-xs"
            title="View Storefront"
          >
            <ExternalLink size={13} className="text-slate-500" />
            <span className="hidden sm:inline">Storefront</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{dict.common.active}</span>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid - 6 responsive cards with crisp values */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          label={dict.dashboard.totalRevenue}
          value={`$${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          subtext={dict.orders.title}
          href="/admin/orders"
          manageLabel={dict.common.manage}
        />

        <StatCard
          label={dict.dashboard.totalOrders}
          value={totalOrders.toLocaleString()}
          icon={ShoppingCart}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          subtext={dict.orders.title}
          href="/admin/orders"
          manageLabel={dict.common.manage}
        />

        <StatCard
          label={dict.dashboard.totalProducts}
          value={totalProducts.toLocaleString()}
          icon={ShoppingBag}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          subtext={dict.products.allProducts}
          href="/admin/products"
          manageLabel={dict.common.manage}
        />

        <StatCard
          label={dict.dashboard.pendingQuotes}
          value={totalQuotes.toLocaleString()}
          icon={FileText}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          subtext={`${pendingQuotes} ${dict.status.PENDING}`}
          href="/admin/quotes"
          manageLabel={dict.common.manage}
        />

        <StatCard
          label={dict.dashboard.activeShipments}
          value={totalShipments.toLocaleString()}
          icon={Ship}
          iconBg="bg-cyan-50"
          iconColor="text-cyan-600"
          subtext={`${activeShipments} ${dict.status.IN_TRANSIT}`}
          href="/admin/shipments"
          manageLabel={dict.common.manage}
        />

        <StatCard
          label={dict.dashboard.wholesaleInquiries}
          value={totalInquiries.toLocaleString()}
          icon={MessageSquare}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          subtext={dict.wholesale.title}
          href="/admin/wholesale"
          manageLabel={dict.common.manage}
        />
      </div>

      {/* Quick Action Station */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={14} className="text-[#c9a84c]" />
            <span>{dict.dashboard.quickActions}</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Fast Operations</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { href: '/admin/products/new', label: dict.products.addProduct, icon: Plus, color: '#1a3a5c' },
            { href: '/admin/orders', label: dict.orders.title, icon: ShoppingCart, color: '#2563eb' },
            { href: '/admin/wholesale', label: dict.wholesale.title, icon: MessageSquare, color: '#d97706' },
            { href: '/admin/quotes', label: dict.quotes.title, icon: FileText, color: '#c9a84c' },
            { href: '/admin/shipments', label: dict.shipments.title, icon: Ship, color: '#059669' },
            { href: '/admin/settings/company', label: dict.settings.companyInfo, icon: Globe, color: '#7c3aed' },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 transition-all duration-150 group bg-slate-50/30"
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${color}15`, color }}
              >
                <Icon size={14} />
              </div>
              <span className="text-xs font-medium text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Operations Stream - 2 Columns (Recent Orders & Recent Shipments) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Recent Orders Panel */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/40">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart size={15} className="text-blue-600" />
                <span>{dict.dashboard.recentOrders || 'Recent Orders'}</span>
              </h3>
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
              >
                <span>{dict.dashboard.viewAll}</span>
                <ArrowUpRight size={12} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <ShoppingCart size={24} className="mx-auto mb-1.5 opacity-30 text-slate-400" />
                  <p>{dict.common.noData}</p>
                </div>
              ) : (
                recentOrders.slice(0, 5).map((ord: any) => (
                  <div key={ord.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/70 transition-colors gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                        <Box size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {ord.orderNumber || ord.id.slice(-8)}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {ord.customerName || ord.user?.name || ord.user?.email || dict.orders.guestCustomer}
                          {ord.createdAt && ` · ${formatDate(ord.createdAt)}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <StatusBadge status={ord.status} label={t(ord.status)} />
                      <p className="text-xs font-bold text-slate-900 mt-1 tabular-nums">
                        {ord.total !== undefined ? `$${Number(ord.total).toFixed(2)}` : '—'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 text-right">
            <Link
              href="/admin/orders"
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
            >
              <span>Manage all sales orders ({totalOrders})</span>
              <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        {/* Recent Shipments Panel */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/40">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Ship size={15} className="text-[#1a3a5c]" />
                <span>{dict.dashboard.recentShipments}</span>
              </h3>
              <Link
                href="/admin/shipments"
                className="text-xs font-semibold text-[#1a3a5c] hover:text-[#c9a84c] inline-flex items-center gap-1 transition-colors"
              >
                <span>{dict.dashboard.viewAll}</span>
                <ArrowUpRight size={12} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentShipments.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <Ship size={24} className="mx-auto mb-1.5 opacity-30 text-slate-400" />
                  <p>{dict.common.noData}</p>
                </div>
              ) : (
                recentShipments.slice(0, 5).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/70 transition-colors gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#1a3a5c] font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                        <Ship size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-semibold text-slate-800 truncate">
                          {s.containerNumber || s.trackingNumber || s.id.slice(-8)}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {s.routeType ? `${s.routeType} · ` : ''}{s.origin || 'China'} → {s.destination || 'Global'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <StatusBadge status={s.status} label={t(s.status)} />
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        {s.departureDate ? formatDate(s.departureDate) : s.service?.name || dict.nav.shipments}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 text-right">
            <Link
              href="/admin/shipments"
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
            >
              <span>Manage all active shipments ({totalShipments})</span>
              <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* System Status & Platform Information Ribbon */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-emerald-600" />
          <span className="font-semibold text-slate-700">{dict.dashboard.platformSecurity}</span>
          <span className="text-slate-500">{dict.dashboard.rbacActive}</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-slate-500 font-medium text-[11px] sm:text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{dict.dashboard.dbOnline}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{dict.dashboard.storeMode} {storeMode || 'WHOLESALE'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>{dict.dashboard.supportedLocales}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
