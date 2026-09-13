'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { 
  FileText, Search, Eye, Edit, Trash2, 
  Clock, CheckCircle, XCircle, AlertTriangle,
  Calendar, DollarSign, Package, User
} from 'lucide-react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { useAdminLocale } from '../contexts/AdminLocaleContext'
import ClientOnly from '@/components/ClientOnly'

interface Quote {
  id: string
  userId: string
  serviceId: string
  serviceType: string
  weight: number | null
  dimensions: string | null
  origin: string
  destination: string
  price: number | null
  validUntil: string | null
  status: string
  description: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    companyName: string | null
    businessType: string | null
  }
  service: {
    id: string
    name: string
    type: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const statusColors = {
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  REVIEWED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  EXPIRED: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
}

export default function AdminQuotesPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth()
  const { dict } = useAdminLocale()
  const [mounted, setMounted] = useState(false)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  })
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && isAdmin) {
      fetchQuotes()
    }
  }, [mounted, isAdmin, pagination.page, statusFilter])

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/admin/quotes?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch quotes')
      }

      const data = await response.json()
      setQuotes(data.quotes || [])
      setPagination(data.pagination || pagination)
      setError(null)
    } catch (err) {
      setError('Failed to load quotes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuote) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/quotes/${selectedQuote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          price: editPrice ? parseFloat(editPrice) : null,
          status: editStatus
        })
      })

      // Refresh quotes
      await fetchQuotes()
      setSelectedQuote(null)
    } catch (err) {
      alert('Failed to update quote')
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote)
    setEditPrice(quote.price?.toString() || '')
    setEditStatus(quote.status || 'PENDING')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDelete = async (quote: Quote) => {
    await handleDeleteQuote(quote.id)
  }

  const handleDeleteQuote = async (id: string) => {
    if (!confirm(dict.common.confirmDelete)) return

    try {
      const response = await fetch(`/api/admin/quotes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete quote')
      }

      // Refresh quotes
      await fetchQuotes()
    } catch (err) {
      alert('Failed to delete quote')
      console.error(err)
    }
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">{dict.common.loading}</p>
        </div>
      </div>
    )
  }

  // Redirect handled by AdminAuthContext
  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dict.quotes.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{dict.quotes.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #c9a84c, #a0843e)' }}>
          <FileText size={16} />
          <span>{pagination.total} {dict.quotes.title}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder={dict.common.search}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{dict.common.all} {dict.common.status}</option>
            <option value="PENDING">{dict.status.PENDING}</option>
            <option value="REVIEWED">{dict.status.PROCESSING}</option>
            <option value="APPROVED">{dict.status.APPROVED}</option>
            <option value="REJECTED">{dict.status.REJECTED}</option>
            <option value="EXPIRED">{dict.status.CANCELLED}</option>
          </select>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
              <p className="text-sm text-gray-500">{dict.common.loading}</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-500">
            <div className="flex flex-col items-center gap-3">
              <AlertTriangle size={40} />
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">{dict.orders.customer}</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">{dict.services.title}</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">{dict.quotes.origin} → {dict.quotes.destination}</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">{dict.common.price}</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">{dict.common.status}</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">{dict.common.date}</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">{dict.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <h4 className="font-medium text-gray-900">{quote.user.name}</h4>
                          <p className="text-xs text-gray-400">{quote.user.email}</p>
                          {quote.user.companyName && (
                            <p className="text-xs text-blue-600">{quote.user.companyName}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{quote.service.name}</p>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 capitalize">
                            {quote.service.type}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <p className="text-gray-900">{quote.origin}</p>
                          <p className="text-gray-400">↓</p>
                          <p className="text-gray-900">{quote.destination}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {quote.price ? (
                          <span className="font-mono text-sm font-medium text-green-600">
                            ${quote.price.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Not set</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[quote.status as keyof typeof statusColors]?.bg || 'bg-gray-50'} ${statusColors[quote.status as keyof typeof statusColors]?.text || 'text-gray-600'} ${statusColors[quote.status as keyof typeof statusColors]?.border || 'border-gray-200'}`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {formatDate(quote.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(quote)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(quote)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  {dict.common.showing} {((pagination.page - 1) * pagination.limit) + 1} {dict.common.to}{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} {dict.common.of} {pagination.total} {dict.quotes.title.toLowerCase()}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    {dict.common.previous}
                  </button>
                  <span className="px-3 py-1.5 text-sm">
                    {pagination.page} {dict.common.of} {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    {dict.common.next}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Quote Modal */}
      <ClientOnly>
        {mounted && selectedQuote && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedQuote(null) }}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-900 mb-6">{dict.common.edit} {dict.quotes.quoteId}</h2>

              <form onSubmit={handleUpdateQuote} className="space-y-4">
                {/* Quote Details Display */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h3 className="font-medium text-gray-900">{dict.common.details}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">{dict.orders.customer}:</span>
                      <p className="font-medium">{selectedQuote.user.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{dict.services.title}:</span>
                      <p className="font-medium">{selectedQuote.service.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{dict.quotes.origin}:</span>
                      <p className="font-medium">{selectedQuote.origin}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{dict.quotes.destination}:</span>
                      <p className="font-medium">{selectedQuote.destination}</p>
                    </div>
                    {selectedQuote.weight && (
                      <div>
                        <span className="text-gray-500">{dict.quotes.weight}:</span>
                        <p className="font-medium">{selectedQuote.weight} kg</p>
                      </div>
                    )}
                    {selectedQuote.dimensions && (
                      <div>
                        <span className="text-gray-500">{dict.quotes.volume}:</span>
                        <p className="font-medium">{selectedQuote.dimensions}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{dict.common.status}</label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="PENDING">{dict.status.PENDING}</option>
                      <option value="REVIEWED">{dict.status.PROCESSING}</option>
                      <option value="APPROVED">{dict.status.APPROVED}</option>
                      <option value="REJECTED">{dict.status.REJECTED}</option>
                      <option value="EXPIRED">{dict.status.CANCELLED}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{dict.quotes.proposedPrice} ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedQuote(null)}
                    className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {dict.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #c9a84c, #a0843e)' }}
                  >
                    {updating ? dict.common.loading : dict.common.update}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </ClientOnly>
    </div>
  )
}