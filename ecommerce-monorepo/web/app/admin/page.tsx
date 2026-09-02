'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Package, FileText, Ship, Users, TrendingUp, TrendingDown,
  DollarSign, Clock, ArrowRight, Globe, CheckCircle, AlertCircle,
  RefreshCw, ShoppingBag, ShoppingCart, MessageSquare, Plus,
  ShieldCheck, Activity, Layers, ArrowUpRight, Sparkles
} from 'lucide-react'
import { useAdminAuth } from './contexts/AdminAuthContext'
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
  label, value, icon: Icon, color, subtext, href
}: {
  label: string
  value: string | number
  icon: any
  color: string
  subtext?: string
  href?: string
}) {
  const content = (
    <div className="group relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-gray-200/60 border border-gray-100/90 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
          <p className="text-2xl lg:text-3xl font-black text-gray-900 mt-2 tracking-tight">{value}</p>
          {subtext && (
            <p className="text-xs text-gray-400 mt-1 font-medium">{subtext}</p>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
      {href && (
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-[#1a3a5c] group-hover:text-[#c9a84c] transition-colors">
          <span>Manage</span>
          <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PROCESSING: 'bg-purple-50 text-purple-700 border-purple-200',
    SHIPPED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    COMPLETED: 'bg-teal-50 text-teal-700 border-teal-200',
    NEW: 'bg-blue-50 text-blue-700 border-blue-200',
    CONTACTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  }
  return (
    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const { isAdmin, user } = useAdminAuth()
  const { settings, storeMode } = useSettings()

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
    } catch (err) {
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
  const totalRev = stats?.totalRevenue ?? overview?.revenue ?? 0
  const totalOrders = stats?.totalOrders ?? overview?.totalOrders ?? 0
  const totalProducts = stats?.totalProducts ?? overview?.totalProducts ?? 0
  const totalQuotes = stats?.totalQuotes ?? overview?.totalQuotes ?? 0
  const totalShipments = stats?.totalShipments ?? overview?.totalShipments ?? 0
  const totalInquiries = stats?.totalWholesaleInquiries ?? overview?.totalWholesaleInquiries ?? 0
  const totalUsers = stats?.totalUsers ?? overview?.totalUsers ?? 0
  const pendingQuotes = stats?.pendingQuotes ?? overview?.pendingQuotes ?? 0
  const activeShipments = stats?.activeShipments ?? overview?.activeShipments ?? 0

  const recentOrders = stats?.recentOrders || stats?.data?.recentOrders || []
  const recentQuotes = stats?.recentQuotes || stats?.data?.recentQuotes || []
  const recentShipments = stats?.recentShipments || stats?.data?.recentShipments || []

  const displayName = user?.name || user?.email?.split('@')[0] || 'Admin'

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin border-t-[#1a3a5c]"></div>
        <p className="text-sm font-medium text-gray-500">Loading management console...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3 text-red-500 bg-red-50 p-6 rounded-2xl border border-red-100 max-w-md text-center">
        <AlertCircle size={36} />
        <p className="font-semibold text-sm">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-2 px-4 py-2 bg-[#1a3a5c] text-white text-xs font-semibold rounded-xl hover:bg-[#0d2a4a] transition"
        >
          Try Again
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-7 pb-10">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#1a3a5c] via-[#1e456e] to-[#0f2744] text-white p-6 rounded-3xl shadow-xl shadow-[#1a3a5c]/10 border border-white/10 relative overflow-hidden">
        {/* Subtle decorative mesh */}
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#c9a84c]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#deb859] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={12} />
            <span>Management Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome back, {displayName}
          </h1>
          <p className="text-white/75 text-xs sm:text-sm mt-1">
            {companyName} Platform Overview · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live System</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Revenue"
          value={`$${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="bg-gradient-to-br from-emerald-500 to-emerald-700"
          subtext="Completed sales"
          href="/admin/orders"
        />
        <StatCard
          label="Sales Orders"
          value={totalOrders}
          icon={ShoppingCart}
          color="bg-gradient-to-br from-blue-600 to-indigo-700"
          subtext="Customer orders"
          href="/admin/orders"
        />
        <StatCard
          label="Catalog Products"
          value={totalProducts}
          icon={ShoppingBag}
          color="bg-gradient-to-br from-purple-500 to-purple-700"
          subtext="Active listings"
          href="/admin/products"
        />
        <StatCard
          label="Quotes / RFQs"
          value={totalQuotes}
          icon={FileText}
          color="bg-gradient-to-br from-[#c9a84c] to-[#a0843e]"
          subtext={`${pendingQuotes} pending action`}
          href="/admin/quotes"
        />
        <StatCard
          label="Shipments"
          value={totalShipments}
          icon={Ship}
          color="bg-gradient-to-br from-cyan-600 to-blue-700"
          subtext={`${activeShipments} in transit`}
          href="/admin/shipments"
        />
        <StatCard
          label="Wholesale Leads"
          value={totalInquiries}
          icon={MessageSquare}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          subtext="B2B inquiries"
          href="/admin/wholesale"
        />
      </div>

      {/* Quick Action Station */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} className="text-[#c9a84c]" />
            Quick Management Shortcuts
          </h2>
          <span className="text-xs text-gray-400 font-medium">1-Click Fast Navigation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: '/admin/products/new', label: 'Add Product', icon: Plus, color: '#1a3a5c' },
            { href: '/admin/orders', label: 'Manage Orders', icon: ShoppingCart, color: '#2563eb' },
            { href: '/admin/wholesale', label: 'Wholesale RFQs', icon: MessageSquare, color: '#d97706' },
            { href: '/admin/quotes', label: 'Review Quotes', icon: FileText, color: '#c9a84c' },
            { href: '/admin/shipments', label: 'Track Shipments', icon: Ship, color: '#059669' },
            { href: '/admin/settings/company', label: 'Company Settings', icon: Globe, color: '#7c3aed' },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md hover:shadow-gray-100 transition-all duration-200 hover:-translate-y-0.5 group bg-gray-50/50 hover:bg-white"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-xs"
                style={{ backgroundColor: `${color}15`, color }}
              >
                <Icon size={19} />
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center group-hover:text-gray-900 transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 2-Column Activity Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                <FileText size={17} className="text-[#c9a84c]" />
                Recent Quotes & Sourcing Inquiries
              </h3>
              <Link
                href="/admin/quotes"
                className="text-xs font-bold text-[#1a3a5c] hover:text-[#c9a84c] inline-flex items-center gap-1 transition-colors"
              >
                View all <ArrowUpRight size={13} />
              </Link>
            </div>

            <div className="divide-y divide-gray-50">
              {recentQuotes.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  <FileText size={28} className="mx-auto mb-2 opacity-40 text-gray-400" />
                  No quotes submitted yet
                </div>
              ) : (
                recentQuotes.map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between p-4 hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-100">
                        {(q.user?.name?.[0] || q.user?.email?.[0] || 'Q').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{q.user?.name || q.user?.email || 'Guest User'}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {q.service?.name || 'General Service'} · {q.origin || 'China'} → {q.destination || 'Global'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <StatusBadge status={q.status} />
                      <p className="text-xs font-bold text-gray-900 mt-1">
                        {q.price ? `$${Number(q.price).toFixed(2)}` : 'Custom Quote'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                <Ship size={17} className="text-[#1a3a5c]" />
                Recent Logistics & Cargo Shipments
              </h3>
              <Link
                href="/admin/shipments"
                className="text-xs font-bold text-[#1a3a5c] hover:text-[#c9a84c] inline-flex items-center gap-1 transition-colors"
              >
                View all <ArrowUpRight size={13} />
              </Link>
            </div>

            <div className="divide-y divide-gray-50">
              {recentShipments.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  <Ship size={28} className="mx-auto mb-2 opacity-40 text-gray-400" />
                  No shipments logged yet
                </div>
              ) : (
                recentShipments.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-4 hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                        <Ship size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-bold text-gray-800 truncate">{s.trackingNumber}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{s.origin || 'China'} → {s.destination || 'Global'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <StatusBadge status={s.status} />
                      <p className="text-[11px] text-gray-400 mt-1">{s.service?.name || 'Freight'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Status & Platform Information */}
      <div className="bg-gray-50/80 rounded-3xl p-5 border border-gray-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-gray-600">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span className="font-semibold text-gray-700">Platform Security:</span>
          <span>Role-Based Access Control Active</span>
        </div>

        <div className="flex items-center gap-6 text-gray-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Database: PostgreSQL Online
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Store Mode: {storeMode || 'WHOLESALE'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            Supported Locales: EN, RU, ZH
          </span>
        </div>
      </div>
    </div>
  )
}

