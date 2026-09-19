'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations, useLocale } from 'next-intl'
import { Container } from '@/components/design-system/Container'
import {
  FileText,
  Search,
  Clock,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Truck,
  Plus,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar
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
  shippingCity: string | null
  preferredShippingMode: string | null
  customerNotes: string | null
  createdAt: string
  items: ProductQuoteItem[]
}

export default function DashboardQuotesPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, isInitialized } = useAuth()
  const [quotes, setQuotes] = useState<ProductQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const t = useTranslations('Dashboard')
  const tq = useTranslations('DashboardPages.quotes')
  const locale = useLocale()

  useEffect(() => {
    if (isInitialized && !authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/quotes')
    }
  }, [isInitialized, authLoading, isAuthenticated, router])

  const loadQuotes = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/b2b/quotes', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setQuotes(data.quotes || [])
      }
    } catch (e) {
      console.error('Failed to load quotes:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadQuotes()
    }
  }, [isInitialized, isAuthenticated, loadQuotes])

  // Status counts for interactive filter pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: quotes.length }
    for (const q of quotes) {
      const s = (q.status || '').toUpperCase()
      counts[s] = (counts[s] || 0) + 1
    }
    return counts
  }, [quotes])

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const matchesSearch =
        !searchTerm ||
        q.quoteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.items.some((i) => i.productName?.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus =
        statusFilter === 'ALL' || (q.status || '').toUpperCase() === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [quotes, searchTerm, statusFilter])

  const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    UNDER_REVIEW: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    PRICED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    SENT: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    VIEWED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    ACCEPTED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    EXPIRED: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
    CANCELLED: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  }

  const getStatusBadge = (status: string) => {
    const s = statusStyles[status] || {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
    }
    const statusKey = status.toLowerCase()
    
    // Convert under_review to Under_review so tq('statusUnder_review') works
    const capKey = statusKey.charAt(0).toUpperCase() + statusKey.slice(1)
    const validKeys = ['pending', 'under_review', 'priced', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled']
    
    const label = validKeys.includes(statusKey) ? tq(`status${capKey}` as any) : status
    return (
      <span
        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${s.bg} ${s.text} ${s.border}`}
      >
        {label}
      </span>
    )
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin"
            style={{ borderTopColor: '#00407a' }}
          ></div>
          <p className="text-xs text-slate-500 font-medium">Loading your quotation records...</p>
        </div>
      </div>
    )
  }

  return (
    <Container className="py-6 sm:py-8 space-y-6">
      {/* Standard Clean Action Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { key: 'ALL', label: tq('allQuotes') },
            { key: 'PENDING', label: tq('underReview') },
            { key: 'SENT', label: tq('pricedSent') },
            { key: 'ACCEPTED', label: tq('accepted') },
            { key: 'REJECTED', label: tq('declined') },
          ].map((pill) => {
            const count = statusCounts[pill.key] || 0
            const isActive = statusFilter === pill.key
            return (
              <button
                key={pill.key}
                onClick={() => setStatusFilter(pill.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#00407a] text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <span>{pill.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Right: Search & Action */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={tq('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
            />
          </div>

          <Link
            href="/store"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#00407a] hover:bg-[#003366] text-white rounded-xl text-xs font-bold shadow-2xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{tq('requestQuote')}</span>
          </Link>
        </div>
      </div>

      {/* Quotes List */}
      <div>
        {filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-500">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">{t('noQuotesYet')}</h3>
            <p className="text-xs text-slate-500 mb-5 max-w-sm">
              {tq('noQuotesDesc')}
            </p>
            <Link
              href="/store"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#00407a] hover:bg-[#003366] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t('requestAQuote')}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredQuotes.map((q) => {
              const totalItems = q.items.reduce((sum, item) => sum + item.quantity, 0)
              const firstItem = q.items[0]

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all duration-200"
                >
                  {/* Top Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{q.quoteNumber}</span>
                          {getStatusBadge(q.status)}
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{tq('submittedOn', { date: new Date(q.createdAt).toLocaleDateString(locale) })}</span>
                          {q.shippingCountry && (
                            <>
                              <span>•</span>
                              <span>{tq('destCountry', { country: q.shippingCountry })}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-[11px] font-semibold text-slate-400">{tq("totalQuotedPrice")}</p>
                      <p className="font-black text-base text-slate-900">
                        {q.totalAmount != null ? (
                          `${q.currency} ${q.totalAmount.toFixed(2)}`
                        ) : (
                          <span className="text-amber-600 text-xs font-bold">{tq("pricingInProgress")}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Middle Items Row */}
                  <div className="py-4 space-y-3">
                    {q.items.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex items-center gap-3.5">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-slate-900 truncate">{item.productName}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <span>{tq("quantityUnits", { quantity: item.quantity })}</span>
                            {item.unitPriceQuoted != null && (
                              <>
                                <span>•</span>
                                <span>{tq("unitPrice", { price: `${q.currency} ${item.unitPriceQuoted.toFixed(2)}` })}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {item.lineTotal != null && (
                          <div className="text-right shrink-0">
                            <span className="font-bold text-xs text-slate-900">
                              {q.currency} {item.lineTotal.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}

                    {q.items.length > 2 && (
                      <p className="text-xs text-slate-400 italic">
                        {tq('moreItems', { count: q.items.length - 2 })}
                      </p>
                    )}
                  </div>

                  {/* Bottom Action Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-4 text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        {tq('escrowProtected')}
                      </span>
                      {q.validUntil && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {tq('validUntilDate', { date: new Date(q.validUntil).toLocaleDateString(locale) })}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/quotes/view/${q.secureToken}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#00407a] hover:bg-[#003366] text-white rounded-xl font-bold text-xs shadow-2xs transition-colors"
                    >
                      <span>{tq('viewQuoteAgreement')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Container>
  )
}
