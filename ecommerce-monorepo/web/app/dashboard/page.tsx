'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { Package, Heart, User, MapPin, Settings, TrendingUp, ShoppingBag, FileText } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalOrders: number
  wishlistItems: number
  savedAddresses: number
}

interface QuoteItem {
  id: string
  serviceType: string
  origin: string
  destination: string
  status: string
  price: number | null
  validUntil: string | null
  description: string | null
  createdAt: string
  service: { name: string } | null
}

export default function CustomerDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const t = useTranslations('Dashboard')
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    wishlistItems: 0,
    savedAddresses: 0,
  })
  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [quotesLoading, setQuotesLoading] = useState(true)
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
      loadQuotes()
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

  const loadQuotes = async () => {
    try {
      setQuotesLoading(true)
      const res = await fetch('/api/quotes', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setQuotes(data.quotes || [])
    } catch (error) {
      console.error('Error loading quotes:', error)
    } finally {
      setQuotesLoading(false)
    }
  }

  const statusStyles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-gray-100 text-gray-600',
  }

  const statusClass = (status: string) =>
    statusStyles[status] || 'bg-gray-100 text-gray-600'

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
      label: t('myOrders'),
      description: t('myOrdersDesc'),
      color: 'bg-blue-500',
      count: stats.totalOrders,
    },
    {
      href: '/dashboard/wishlist',
      icon: Heart,
      label: t('wishlist'),
      description: t('wishlistDesc'),
      color: 'bg-red-500',
      count: stats.wishlistItems,
    },
    {
      href: '/dashboard/profile',
      icon: User,
      label: t('profile'),
      description: t('profileDesc'),
      color: 'bg-purple-500',
    },
    {
      href: '/dashboard/addresses',
      icon: MapPin,
      label: t('addresses'),
      description: t('addressesDesc'),
      color: 'bg-green-500',
      count: stats.savedAddresses,
    },
    {
      href: '/products',
      icon: ShoppingBag,
      label: t('shopProducts'),
      description: t('shopProductsDesc'),
      color: 'bg-orange-500',
    },
    {
      href: '/dashboard/settings',
      icon: Settings,
      label: t('settings'),
      description: t('settingsDesc'),
      color: 'bg-gray-500',
    },
    {
      href: '/quotes',
      icon: FileText,
      label: t('myQuotes'),
      description: t('myQuotesDesc'),
      color: 'bg-indigo-500',
      count: quotes.length,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Message */}
      <div className="mb-8">
        <p className="text-lg text-gray-600">
          {t('welcome')} <span className="font-semibold text-[#1a3a5c]">{user.name}</span>!
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
                <p className="text-sm text-gray-500">{t('totalOrders')}</p>
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
                <p className="text-sm text-gray-500">{t('wishlistItems')}</p>
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
                <p className="text-sm text-gray-500">{t('savedAddresses')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('quickActions')}</h2>
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

        {/* My Quotes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{t('myQuotes')}</h2>
            <Link
              href="/quotes"
              className="text-sm text-[#1a3a5c] hover:text-[#2a5a8c] font-medium"
            >
              {t('viewAll')}
            </Link>
          </div>

          {quotesLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="animate-pulse flex flex-col gap-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ) : quotes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col items-center justify-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-center">{t('noQuotesYet')}</p>
                <Link
                  href="/quotes"
                  className="mt-3 px-5 py-2 bg-[#1a3a5c] text-white rounded-lg hover:bg-[#2a5a8c] transition-colors text-sm"
                >
                  {t('requestAQuote')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {quotes.slice(0, 5).map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {q.service?.name || q.serviceType}
                        </p>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusClass(q.status)}`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {q.origin} &rarr; {q.destination}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-900">
                        {q.price != null ? `$${q.price.toFixed(2)}` : '—'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('recentActivity')}</h2>
          <div className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">{t('noRecentActivity')}</p>
            <p className="text-sm text-gray-400 mt-2">
              {t('startShopping')}
            </p>
            <Link
              href="/products"
              className="mt-4 px-6 py-2 bg-[#1a3a5c] text-white rounded-lg hover:bg-[#2a5a8c] transition-colors"
            >
              {t('browseProducts')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
