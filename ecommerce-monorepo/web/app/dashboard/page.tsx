'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Package, Heart, User, MapPin, Settings, TrendingUp, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalOrders: number
  wishlistItems: number
  savedAddresses: number
}

export default function CustomerDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    wishlistItems: 0,
    savedAddresses: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard')
      return
    }

    if (!isLoading && user) {
      // Redirect non-customers
      if (user.role === 'ADMIN') {
        router.push('/admin')
        return
      }
      if (user.role === 'SUPPLIER') {
        router.push('/dashboard/supplier')
        return
      }

      loadDashboardData()
    }
  }, [user, isAuthenticated, isLoading, router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // You can add API calls here to fetch real stats
      // For now, we'll use placeholder data
      setStats({
        totalOrders: 0,
        wishlistItems: 0,
        savedAddresses: 0,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'USER') {
    return null
  }

  const menuItems = [
    {
      href: '/dashboard/orders',
      icon: Package,
      label: 'My Orders',
      description: 'View and track your orders',
      color: 'bg-blue-500',
      count: stats.totalOrders,
    },
    {
      href: '/dashboard/wishlist',
      icon: Heart,
      label: 'Wishlist',
      description: 'Your saved products',
      color: 'bg-red-500',
      count: stats.wishlistItems,
    },
    {
      href: '/dashboard/profile',
      icon: User,
      label: 'Profile',
      description: 'Manage your account',
      color: 'bg-purple-500',
    },
    {
      href: '/dashboard/addresses',
      icon: MapPin,
      label: 'Addresses',
      description: 'Manage shipping addresses',
      color: 'bg-green-500',
      count: stats.savedAddresses,
    },
    {
      href: '/products',
      icon: ShoppingBag,
      label: 'Shop Products',
      description: 'Browse our catalog',
      color: 'bg-orange-500',
    },
    {
      href: '/dashboard/settings',
      icon: Settings,
      label: 'Settings',
      description: 'Account preferences',
      color: 'bg-gray-500',
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Message */}
      <div className="mb-8">
        <p className="text-lg text-gray-600">
          Welcome back, <span className="font-semibold text-[#1a3a5c]">{user.name}</span>!
        </p>
      </div>

      <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-sm text-gray-500">Total Orders</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.wishlistItems}</p>
                <p className="text-sm text-gray-500">Wishlist Items</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.savedAddresses}</p>
                <p className="text-sm text-gray-500">Saved Addresses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
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

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">No recent activity</p>
            <p className="text-sm text-gray-400 mt-2">
              Start shopping to see your activity here
            </p>
            <Link
              href="/products"
              className="mt-4 px-6 py-2 bg-[#1a3a5c] text-white rounded-lg hover:bg-[#2a5a8c] transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
