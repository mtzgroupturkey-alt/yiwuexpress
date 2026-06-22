'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Package, FileText, Ship, Users, TrendingUp, TrendingDown,
  DollarSign, Clock, ArrowRight, Globe, CheckCircle, AlertCircle
} from 'lucide-react'
import { useAdminAuth } from './contexts/AdminAuthContext'

interface Stats {
  totalServices: number
  totalQuotes: number
  totalShipments: number
  totalUsers: number
  pendingQuotes: number
  activeShipments: number
  totalRevenue: number
  thisMonthRevenue: number
  revenueGrowth: number
  quotesGrowth: number
  shipmentsGrowth: number
  usersGrowth: number
  recentQuotes: any[]
  recentShipments: any[]
}

function StatCard({
  label, value, icon: Icon, color, change, changeLabel
}: {
  label: string
  value: string | number
  icon: any
  color: string
  change?: number
  changeLabel?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {change >= 0 ? (
                <TrendingUp size={14} className="text-emerald-500" />
              ) : (
                <TrendingDown size={14} className="text-red-500" />
              )}
              <span className={`text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {change >= 0 ? '+' : ''}{change}% {changeLabel}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  )
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
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { isAdmin, token } = useAdminAuth()

  useEffect(() => {
    // Only fetch stats if we're authenticated and have a token
    if (!isAdmin || !token) return
    
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        const data = await response.json()
        
        if (response.ok) {
          setStats(data)
          setError('')
        } else {
          setError(data.error || 'Failed to load stats')
        }
      } catch (err) {
        setError('Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isAdmin, token]) // Depend on authentication state

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3 text-red-500">
        <AlertCircle size={40} />
        <p>{error}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, Admin · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #1a3a5c, #2563eb)' }}>
          <Globe size={16} />
          <span>Live</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Revenue"
          value={`$${(stats?.totalRevenue ?? 0).toLocaleString()}`}
          icon={DollarSign}
          color="bg-gradient-to-br from-emerald-500 to-emerald-700"
          change={stats?.revenueGrowth}
          changeLabel="this month"
        />
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          color="bg-gradient-to-br from-purple-500 to-purple-700"
          change={stats?.usersGrowth}
          changeLabel="this month"
        />
        <StatCard
          label="Total Quotes"
          value={stats?.totalQuotes ?? 0}
          icon={FileText}
          color="bg-gradient-to-br from-[#c9a84c] to-[#a0843e]"
          change={stats?.quotesGrowth}
          changeLabel="this month"
        />
        <StatCard
          label="Shipments"
          value={stats?.totalShipments ?? 0}
          icon={Ship}
          color="bg-gradient-to-br from-blue-500 to-blue-700"
          change={stats?.shipmentsGrowth}
          changeLabel="this month"
        />
        <StatCard
          label="Pending Quotes"
          value={stats?.pendingQuotes ?? 0}
          icon={Clock}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={18} style={{ color: '#c9a84c' }} />
              Recent Quotes
            </h3>
            <Link href="/admin/quotes" className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: '#1a3a5c' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(stats?.recentQuotes || []).length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No quotes yet</div>
            ) : (
              stats?.recentQuotes.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{q.user?.name || q.user?.email || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{q.service?.name} · {q.origin} → {q.destination}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={q.status} />
                    <p className="text-xs text-gray-400 mt-1">${q.price?.toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Ship size={18} style={{ color: '#1a3a5c' }} />
              Recent Shipments
            </h3>
            <Link href="/admin/shipments" className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: '#1a3a5c' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(stats?.recentShipments || []).length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No shipments yet</div>
            ) : (
              stats?.recentShipments.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-800 font-mono">{s.trackingNumber}</p>
                    <p className="text-xs text-gray-400">{s.origin} → {s.destination}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={s.status} />
                    <p className="text-xs text-gray-400 mt-1">{s.service?.name}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/admin/services', label: 'Add Service', icon: Package, color: '#1a3a5c' },
            { href: '/admin/quotes', label: 'Review Quotes', icon: FileText, color: '#c9a84c' },
            { href: '/admin/shipments', label: 'Track Shipments', icon: Ship, color: '#059669' },
            { href: '/admin/users', label: 'Manage Users', icon: Users, color: '#7c3aed' },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5 group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: `${color}15` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
