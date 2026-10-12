'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { useWishlist } from '@/hooks/useWishlist'
import { useSettings } from '@/components/SettingsProvider'
import { Container } from '@/components/design-system/Container'
import {
  Package,
  Heart,
  User,
  MapPin,
  Settings,
  FileText,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Sparkles,
  Calculator,
  HelpCircle,
  Clock,
  ChevronRight,
  ShoppingBag,
  HeadphonesIcon
} from 'lucide-react'
import Link from 'next/link'

interface ProductQuoteItem {
  id: string
  productName: string
  productSku: string | null
  productImage: string | null
  quantity: number
  unitPriceQuoted: number | null
  lineTotal: number | null
}

interface ProductQuote {
  id: string
  quoteNumber: string
  status: string
  currency: string
  subtotal: number | null
  totalAmount: number | null
  validUntil: string | null
  secureToken: string
  shippingCountry: string | null
  createdAt: string
  items: ProductQuoteItem[]
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  product?: {
    id: string
    name: string
    slug: string
    thumbnail?: string | null
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount?: number
  total?: number
  createdAt: string
  items: OrderItem[]
}

export default function CustomerDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, isInitialized } = useAuth()
  const { wishlistCount } = useWishlist()
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'
  const t = useTranslations('Dashboard')

  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [quotes, setQuotes] = useState<ProductQuote[]>([])
  const [quotesLoading, setQuotesLoading] = useState(true)
  const [addressCount, setAddressCount] = useState(0)

  // Auth Protection
  useEffect(() => {
    if (isInitialized && !authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard')
      return
    }

    if (isInitialized && !authLoading && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin')
        return
      }
      if (user.role === 'SUPPLIER') {
        router.push('/dashboard/supplier')
        return
      }
      // Wholesale & BOTH accounts must be routed to the Wholesale Business Portal
      // TODO: detect locale from NEXT_LOCALE cookie for non-en locales
      if (user.userType === 'WHOLESALE' || user.userType === 'BOTH') {
        router.push('/en/business/dashboard')
        return
      }

      loadData()
    }
  }, [user, isAuthenticated, authLoading, isInitialized, router])

  const loadData = useCallback(async () => {
    // 1. Load quotes
    try {
      setQuotesLoading(true)
      const res = await fetch('/api/b2b/quotes', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setQuotes(data.quotes || [])
      }
    } catch (e) {
      console.error('Error fetching quotes:', e)
    } finally {
      setQuotesLoading(false)
    }

    // 2. Load orders
    try {
      setOrdersLoading(true)
      const res = await fetch('/api/orders', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.data || [])
      }
    } catch (e) {
      console.error('Error fetching orders:', e)
    } finally {
      setOrdersLoading(false)
    }

    // 3. Load addresses count
    try {
      const res = await fetch('/api/addresses', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setAddressCount(data.data?.length || 0)
      }
    } catch (e) {
      console.error('Error fetching addresses count:', e)
    }
  }, [])

  const quoteStatusStyles: Record<string, { bg: string; text: string; border: string }> = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    SENT: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    VIEWED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    ACCEPTED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    EXPIRED: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  }

  const orderStatusStyles: Record<string, { bg: string; text: string; border: string }> = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    PROCESSING: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    SHIPPED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  }

  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: '#00407a' }}></div>
          <p className="text-xs text-slate-500 font-medium">{t('loadingPortal')}</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'USER') {
    return null
  }

  const isWholesaleUser = Boolean(user && (user.userType === 'WHOLESALE' || user.userType === 'BOTH'))

  const quickNavCards = [
    {
      href: '/dashboard/orders',
      icon: Package,
      label: t('myOrders'),
      description: t('myOrdersDesc'),
      count: orders.length,
      badgeText: t('shipments'),
      color: 'text-[#00407a] bg-blue-50/80 group-hover:bg-[#00407a] group-hover:text-white',
    },
    ...(isWholesaleUser
      ? [
          {
            href: '/dashboard/quotes',
            icon: FileText,
            label: t('myQuotes'),
            description: t('myQuotesDesc'),
            count: quotes.length,
            badgeText: t('rfqs'),
            color: 'text-amber-700 bg-amber-50/80 group-hover:bg-[#F5A602] group-hover:text-slate-950',
          },
        ]
      : []),
    {
      href: '/dashboard/wishlist',
      icon: Heart,
      label: t('wishlist'),
      description: t('wishlistDesc'),
      count: wishlistCount,
      badgeText: t('favorites'),
      color: 'text-rose-600 bg-rose-50/80 group-hover:bg-rose-600 group-hover:text-white',
    },
    {
      href: '/dashboard/addresses',
      icon: MapPin,
      label: t('addresses'),
      description: t('addressesDesc'),
      count: addressCount,
      badgeText: t('locations'),
      color: 'text-emerald-700 bg-emerald-50/80 group-hover:bg-emerald-600 group-hover:text-white',
    },
    {
      href: '/dashboard/profile',
      icon: User,
      label: t('profile'),
      description: t('profileDesc'),
      color: 'text-indigo-600 bg-indigo-50/80 group-hover:bg-indigo-600 group-hover:text-white',
    },
    {
      href: '/dashboard/settings',
      icon: Settings,
      label: t('settings'),
      description: t('settingsDesc'),
      color: 'text-slate-700 bg-slate-100 group-hover:bg-slate-800 group-hover:text-white',
    },
  ]

  return (
    <Container className="py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* 4 Metric Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Orders */}
        <Link
          href="/dashboard/orders"
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-[#00407a]/30 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00407a] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-[#00407a] transition-colors flex items-center gap-0.5">
              {t('viewDetails')} <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {ordersLoading ? '...' : orders.length}
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{t('totalOrders')}</p>
          </div>
        </Link>

        {/* 2nd Card: Quotes & RFQs for Wholesale, or Wishlist for Retail */}
        {isWholesaleUser ? (
          <Link
            href="/dashboard/quotes"
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-amber-400/50 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-amber-700 transition-colors flex items-center gap-0.5">
                {t('myQuotes')} <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {quotesLoading ? '...' : quotes.length}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{t('myQuotes')}</p>
            </div>
          </Link>
        ) : (
          <Link
            href="/dashboard/wishlist"
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-rose-400/50 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-rose-600 transition-colors flex items-center gap-0.5">
                {t('favorites')} <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {wishlistCount}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{t('wishlistItems')}</p>
            </div>
          </Link>
        )}

        {/* 3rd Card: Wishlist for Wholesale, or Saved Addresses for Retail */}
        {isWholesaleUser ? (
          <Link
            href="/dashboard/wishlist"
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-rose-400/50 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-rose-600 transition-colors flex items-center gap-0.5">
                {t('favorites')} <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {wishlistCount}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{t('wishlistItems')}</p>
            </div>
          </Link>
        ) : (
          <Link
            href="/dashboard/addresses"
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-400/50 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-700 transition-colors flex items-center gap-0.5">
                {t('addresses')} <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {addressCount}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{t('savedAddresses')}</p>
            </div>
          </Link>
        )}

        {/* 4th Card: Saved Addresses for Wholesale, or Profile/Settings for Retail */}
        {isWholesaleUser ? (
          <Link
            href="/dashboard/addresses"
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-400/50 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-700 transition-colors flex items-center gap-0.5">
                {t('addresses')} <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {addressCount}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{t('savedAddresses')}</p>
            </div>
          </Link>
        ) : (
          <Link
            href="/dashboard/profile"
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-400/50 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-0.5">
                {t('profile')} <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                {user.name || user.email.split('@')[0]}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{t('profile')}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Main Grid: 8 Cols Content / 4 Cols Sourcing & Services */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Hub Navigation Cards */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F5A602]" />
                  {t('quickActions')}
                </h2>
                <p className="text-xs text-slate-500 font-medium">{t('shortcutsDesc')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {quickNavCards.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="p-4 rounded-xl border border-slate-200/80 hover:border-[#00407a]/30 hover:shadow-xs bg-slate-50/50 hover:bg-white transition-all duration-200 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {item.count !== undefined && item.count > 0 && (
                          <span className="text-[11px] font-bold bg-[#00407a] text-white rounded-full px-2 py-0.5 shadow-2xs">
                            {item.count}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#00407a] transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-[#00407a] transition-colors">
                      <span>{t('openSection')}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Recent Orders Preview (Shown primarily for all, especially Retail) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#00407a]" />
                  {t('recentActivity')}
                </h2>
                <p className="text-xs text-slate-500 font-medium">{t('recentPurchases')}</p>
              </div>

              <Link
                href="/dashboard/orders"
                className="text-xs font-bold text-[#00407a] hover:text-[#003366] hover:underline"
              >
                {t('viewAll')}
              </Link>
            </div>

            {ordersLoading ? (
              <div className="p-6 space-y-3">
                <div className="animate-pulse h-16 bg-slate-50 rounded-xl"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{t('noRecentActivity')}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {t('startShopping')}
                </p>
                <Link
                  href="/store"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#00407a] hover:bg-[#003366] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {t('browseProducts')}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.slice(0, 3).map((order) => {
                  const style = orderStatusStyles[order.status] || {
                    bg: 'bg-slate-50',
                    text: 'text-slate-600',
                    border: 'border-slate-200',
                  }
                  const amount = order.totalAmount ?? order.total ?? 0

                  return (
                    <div
                      key={order.id}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00407a] flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              #{order.orderNumber || order.id.slice(0, 8)}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString()} · {t('itemsIncluded', { count: order.items?.length || 1 })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-black text-sm text-slate-900">
                          ${amount.toFixed(2)}
                        </p>
                        <Link
                          href="/dashboard/orders"
                          className="text-[11px] font-bold text-[#00407a] hover:underline flex items-center gap-0.5 justify-end mt-0.5"
                        >
                          {t('viewOrder')} <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quotes & RFQs Section (Only for Wholesale Users, or if Quotes exist) */}
          {(isWholesaleUser || quotes.length > 0) && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#00407a]" />
                    {t('myQuotes')}
                    {quotes.length > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#00407a] border border-blue-100">
                        {quotes.length}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">{t('trackQuotesDesc')}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/quotes"
                    className="text-xs font-bold text-[#00407a] hover:text-[#003366] hover:underline"
                  >
                    {t('viewAll')}
                  </Link>
                  <Link
                    href="/store"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00407a] hover:bg-[#003366] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
                  >
                    {t('requestAQuote')}
                  </Link>
                </div>
              </div>

              {quotesLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : quotes.length === 0 ? (
                <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{t('noQuotesYet')}</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Request direct factory wholesale quotations for any item in our catalog with guaranteed escrow and QC.
                  </p>
                  <Link
                    href="/store"
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#00407a] hover:bg-[#003366] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {t('requestAQuote')}
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {quotes.slice(0, 4).map((q) => {
                    const style = quoteStatusStyles[q.status] || {
                      bg: 'bg-slate-50',
                      text: 'text-slate-600',
                      border: 'border-slate-200',
                    }

                    return (
                      <Link
                        key={q.id}
                        href={`/quotes/view/${q.secureToken}`}
                        className="flex items-center justify-between gap-4 p-4 sm:p-5 hover:bg-slate-50/80 transition-colors group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {q.items[0]?.productImage ? (
                            <img
                              src={q.items[0].productImage}
                              alt={q.items[0].productName}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 bg-white"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 group-hover:text-[#00407a] transition-colors">
                                {q.quoteNumber}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}
                              >
                                {q.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium truncate mt-0.5 max-w-[240px] sm:max-w-[340px]">
                              {q.items.length === 1 ? q.items[0].productName : t('itemsIncluded', { count: q.items.length })}
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(q.createdAt).toLocaleDateString()}
                              {q.shippingCountry && ` · ${t('deliverTo', { country: q.shippingCountry })}`}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-black text-sm text-slate-900">
                            {q.totalAmount != null ? (
                              `${q.currency} ${q.totalAmount.toFixed(2)}`
                            ) : (
                              <span className="text-amber-600 text-xs font-bold">{t('pricingPending')}</span>
                            )}
                          </p>
                          <span className="text-[11px] font-bold text-[#00407a] group-hover:underline inline-flex items-center gap-0.5 mt-0.5">
                            {t('viewDetails')} <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Sourcing Assistance or Retail Benefits */}
        <div className="lg:col-span-4 space-y-6">
          {isWholesaleUser ? (
            /* Dedicated China Sourcing Desk Card for Wholesale Users */
            <div className="relative overflow-hidden bg-gradient-to-br from-[#00407a] via-[#003366] to-[#002244] text-white rounded-2xl p-6 shadow-sm border border-slate-800">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#F5A602]/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5A602]/20 text-[#F5A602] border border-[#F5A602]/30 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5A602] animate-pulse"></span>
                  Direct China Office
                </span>
                <Sparkles className="w-4 h-4 text-[#F5A602]" />
              </div>

              <h3 className="text-lg font-black tracking-tight text-white">
                Need Custom Sourcing?
              </h3>
              <p className="text-xs text-slate-200 mt-1.5 leading-relaxed font-normal">
                Our on-the-ground sourcing team in China inspects factories, negotiates wholesale pricing, and consolidates global container freight for you.
              </p>

              <div className="mt-5 space-y-2.5">
                <Link
                  href="/store"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F5A602] hover:bg-[#d99200] text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>{t('browseWholesale')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/contact"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-colors flex items-center justify-center gap-1.5"
                >
                  <HeadphonesIcon className="w-3.5 h-3.5" />
                  <span>{t('contactSourcing')}</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Retail Welcome & Business Upgrade Card */
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-[#002244] text-white rounded-2xl p-6 shadow-sm border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Personal Account Active
                </span>
                <Sparkles className="w-4 h-4 text-[#F5A602]" />
              </div>

              <h3 className="text-lg font-black tracking-tight text-white">
                Buying for Business?
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-normal">
                Upgrade to a Verified B2B Wholesale Account to unlock container tier pricing, official VAT invoicing, and direct factory custom orders.
              </p>

              <div className="mt-5 space-y-2.5">
                <Link
                  href="/register-b2b"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F5A602] hover:bg-[#d99200] text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Apply for Wholesale Tier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/store"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </div>
          )}

          {/* Trade Assurance & Escrow Box */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#00407a]" />
              <h3 className="font-black text-sm text-slate-900 tracking-tight">
                {t('tradeAssurance')}
              </h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t('escrowProtection')}</h4>
                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                    {t('escrowDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#00407a] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t('preShipment')}</h4>
                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                    {t('preShipmentDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t('logistics')}</h4>
                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                    {t('logisticsDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sourcing Tools & Help Shortcuts */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              {t('helpTools')}
            </h4>
            <div className="space-y-1">
              <Link
                href="/calculator"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-[#00407a] transition-colors group text-xs font-bold"
              >
                <span className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-slate-400 group-hover:text-[#00407a]" />
                  {t('freightCalculator')}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href="/track"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-[#00407a] transition-colors group text-xs font-bold"
              >
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-400 group-hover:text-[#00407a]" />
                  {t('trackConsignment')}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href="/faq"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-[#00407a] transition-colors group text-xs font-bold"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-[#00407a]" />
                  {t('tradeFaq')}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}
