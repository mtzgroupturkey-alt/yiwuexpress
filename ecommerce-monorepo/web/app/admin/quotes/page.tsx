'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText, Clock, CheckCircle2, XCircle, AlertCircle, Send, Search,
  Filter, RefreshCw, ArrowRight, Building2, User, ChevronRight, Eye
} from 'lucide-react'
import { useAdminAuth } from '../contexts/AdminAuthContext'

interface QuoteItemSummary {
  id: string
  productName: string
  productSku: string
  quantity: number
  unitPriceQuoted: number | null
  lineTotal: number | null
}

interface QuoteSummary {
  id: string
  quoteNumber: string
  status: string
  currency: string
  totalAmount: number | null
  subtotal: number | null
  guestName: string | null
  guestEmail: string | null
  guestCompany: string | null
  shippingCountry: string | null
  shippingCity: string | null
  createdAt: string
  validUntil: string | null
  user: {
    id: string
    name: string | null
    email: string
    userType: string
    verificationStatus: string
  } | null
  items: QuoteItemSummary[]
  _count: { items: number }
}

interface StatusCounts {
  ALL: number
  PENDING: number
  UNDER_REVIEW: number
  PRICED: number
  SENT: number
  ACCEPTED: number
  REJECTED: number
  EXPIRED: number
}

export default function AdminQuotesPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth()
  const [quotes, setQuotes] = useState<QuoteSummary[]>([])
  const [counts, setCounts] = useState<StatusCounts>({
    ALL: 0,
    PENDING: 0,
    UNDER_REVIEW: 0,
    PRICED: 0,
    SENT: 0,
    ACCEPTED: 0,
    REJECTED: 0,
    EXPIRED: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchQuotes()
    }
  }, [authLoading, isAdmin, selectedStatus, page])

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: selectedStatus,
        page: String(page),
        limit: '15',
      })
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }

      const res = await fetch(`/api/admin/b2b/quotes?${params.toString()}`, {
        credentials: 'include',
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setQuotes(data.quotes || [])
        setCounts(data.counts || counts)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (err) {
      console.error('Error loading quotes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchQuotes()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock size={12} /> Pending Pricing
          </span>
        )
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <RefreshCw size={12} className="animate-spin" /> In Negotiation
          </span>
        )
      case 'PRICED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <CheckCircle2 size={12} /> Draft Priced
          </span>
        )
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Send size={12} /> Offer Sent
          </span>
        )
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} /> Accepted & Ordered
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle size={12} /> Declined
          </span>
        )
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
            <Clock size={12} /> Expired
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  if (authLoading) return null

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 shadow-md text-white">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">B2B Quotations & RFQ Desk</h1>
            <p className="text-xs text-gray-500">Review customer requests, audit multi-warehouse availability, and issue commercial quotes</p>
          </div>
        </div>

        <button
          onClick={() => fetchQuotes()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm transition"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh Desk
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => { setSelectedStatus('PENDING'); setPage(1); }}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            selectedStatus === 'PENDING'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-gray-200 hover:border-amber-200 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Pricing</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{counts.PENDING}</p>
          <span className="text-[11px] text-gray-500">Requires line quote</span>
        </div>

        <div
          onClick={() => { setSelectedStatus('UNDER_REVIEW'); setPage(1); }}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            selectedStatus === 'UNDER_REVIEW'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400'
              : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Under Review</span>
            <RefreshCw size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{counts.UNDER_REVIEW}</p>
          <span className="text-[11px] text-gray-500">Revision requested</span>
        </div>

        <div
          onClick={() => { setSelectedStatus('SENT'); setPage(1); }}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            selectedStatus === 'SENT'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400'
              : 'bg-white border-gray-200 hover:border-purple-200 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Offers Sent</span>
            <Send size={18} className="text-purple-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{counts.SENT}</p>
          <span className="text-[11px] text-gray-500">Awaiting customer acceptance</span>
        </div>

        <div
          onClick={() => { setSelectedStatus('ACCEPTED'); setPage(1); }}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            selectedStatus === 'ACCEPTED'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400'
              : 'bg-white border-gray-200 hover:border-emerald-200 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Accepted</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{counts.ACCEPTED}</p>
          <span className="text-[11px] text-gray-500">Converted to Orders</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { key: 'ALL', label: 'All Quotes', count: counts.ALL },
            { key: 'PENDING', label: 'Pending', count: counts.PENDING },
            { key: 'UNDER_REVIEW', label: 'Revisions', count: counts.UNDER_REVIEW },
            { key: 'PRICED', label: 'Draft Priced', count: counts.PRICED },
            { key: 'SENT', label: 'Sent', count: counts.SENT },
            { key: 'ACCEPTED', label: 'Accepted', count: counts.ACCEPTED },
            { key: 'EXPIRED', label: 'Expired', count: counts.EXPIRED },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setSelectedStatus(tab.key); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedStatus === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedStatus === tab.key ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search quote#, company, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
          />
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <RefreshCw size={28} className="animate-spin text-blue-600 mb-3" />
            <p className="text-xs font-semibold text-gray-500">Loading quotation requests...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center p-16">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-700">No quotation requests found</p>
            <p className="text-xs text-gray-500 mt-1">There are no quotes matching the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Quote Number</th>
                  <th className="py-3.5 px-4">Customer & Company</th>
                  <th className="py-3.5 px-4">Line Items</th>
                  <th className="py-3.5 px-4">Quoted Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {quotes.map((quote) => {
                  const company = quote.guestCompany || quote.user?.name || 'Individual B2B Client'
                  const contact = quote.guestName || quote.user?.name || quote.guestEmail || quote.user?.email || 'N/A'
                  const email = quote.guestEmail || quote.user?.email

                  return (
                    <tr key={quote.id} className="hover:bg-blue-50/30 transition">
                      <td className="py-4 px-4 font-mono font-bold text-blue-700">
                        <Link href={`/admin/quotes/${quote.id}`} className="hover:underline flex items-center gap-1">
                          {quote.quoteNumber}
                        </Link>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={15} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-gray-900">{company}</p>
                            <p className="text-[11px] text-gray-500">{contact} • {email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-800">{quote._count.items} lines</span>
                        <p className="text-[11px] text-gray-500">
                          {quote.items.slice(0, 2).map(i => i.productName).join(', ')}
                          {quote.items.length > 2 ? '...' : ''}
                        </p>
                      </td>

                      <td className="py-4 px-4 font-bold text-gray-900">
                        {quote.totalAmount ? (
                          <span className="text-emerald-700 font-mono text-sm">
                            ${quote.totalAmount.toFixed(2)} {quote.currency}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Unpriced Draft</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {getStatusBadge(quote.status)}
                      </td>

                      <td className="py-4 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(quote.createdAt).toLocaleDateString()}
                        <p className="text-[10px] text-gray-400">
                          {new Date(quote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/admin/quotes/${quote.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white transition shadow-sm"
                        >
                          <span>Review & Price</span>
                          <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded-lg border border-gray-300 text-xs font-semibold disabled:opacity-40 hover:bg-white"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded-lg border border-gray-300 text-xs font-semibold disabled:opacity-40 hover:bg-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}