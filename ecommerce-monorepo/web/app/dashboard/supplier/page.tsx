'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag,
  BarChart3,
  Settings,
  FileText,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface SupplierStats {
  totalProducts: number
  totalSales: number
  revenue: string
  pendingOrders: number
}

export default function SupplierDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [stats, setStats] = useState<SupplierStats>({
    totalProducts: 0,
    totalSales: 0,
    revenue: '$0.00',
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/supplier')
      return
    }

    if (!isLoading && user) {
      // Only suppliers can access this dashboard
      if (user.role !== 'SUPPLIER') {
        if (user.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
        return
      }

      loadSupplierData()
    }
  }, [user, isAuthenticated, isLoading, router])

  const loadSupplierData = async () => {
    try {
      setLoading(true)
      // Add API calls here to fetch supplier stats
      setStats({
        totalProducts: 0,
        totalSales: 0,
        revenue: '$0.00',
        pendingOrders: 0,
      })
    } catch (error) {
      console.error('Error loading supplier data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">Loading supplier dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'SUPPLIER') {
    return null
  }

  const quickActions = [
    {
      href: '/dashboard/supplier/products',
      icon: Package,
      label: 'My Products',
      description: 'Manage your product catalog',
      color: 'bg-blue-500',
      count: stats.totalProducts,
    },
    {
      href: '/dashboard/supplier/orders',
      icon: ShoppingBag,
      label: 'Orders',
      description: 'View and fulfill orders',
      color: 'bg-orange-500',
      count: stats.pendingOrders,
    },
    {
      href: '/dashboard/supplier/analytics',
      icon: BarChart3,
      label: 'Analytics',
      description: 'View sales performance',
      color: 'bg-purple-500',
    },
    {
      href: '/dashboard/supplier/payouts',
      icon: DollarSign,
      label: 'Payouts',
      description: 'Manage your earnings',
      color: 'bg-green-500',
    },
    {
      href: '/dashboard/supplier/reports',
      icon: FileText,
      label: 'Reports',
      description: 'Download sales reports',
      color: 'bg-indigo-500',
    },
    {
      href: '/dashboard/supplier/settings',
      icon: Settings,
      label: 'Settings',
      description: 'Supplier profile settings',
      color: 'bg-gray-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a3a5c] to-[#2a5a8c] text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Supplier Dashboard
              </h1>
              <p className="text-sm text-white/80 mt-1">
                {user.supplierProfile?.companyName || user.name}
              </p>
              {user.supplierProfile?.businessType && (
                <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                  {user.supplierProfile.businessType}
                </span>
              )}
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium bg-white text-[#1a3a5c] rounded-lg hover:bg-gray-100 transition-colors"
            >
              Back to Site
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
            <p className="text-xs text-gray-500 mt-1">Active listings</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalSales}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <DollarSign className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.revenue}</p>
            <p className="text-xs text-gray-500 mt-1">Total earnings</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <ShoppingBag className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting fulfillment</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-[#1a3a5c]/20 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`${item.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#1a3a5c]">
                        {item.label}
                      </h3>
                      {item.count !== undefined && item.count > 0 && (
                        <span className="text-xs font-bold bg-[#1a3a5c] text-white rounded-full px-2 py-1">
                          {item.count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Getting Started Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Welcome to Your Supplier Dashboard!
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                This is your central hub for managing products, orders, and sales. 
                Start by adding your first product or explore the analytics section.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/dashboard/supplier/products/new"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  Add Your First Product
                </Link>
                <Link
                  href="/dashboard/supplier/settings"
                  className="px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 text-sm font-medium transition-colors"
                >
                  Complete Your Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
