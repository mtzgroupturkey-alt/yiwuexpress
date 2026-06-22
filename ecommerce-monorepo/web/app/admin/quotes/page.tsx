'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { 
  FileText, Search, Eye, Edit, Trash2, 
  Clock, CheckCircle, XCircle, AlertTriangle,
  Calendar, DollarSign, Package, User
} from 'lucide-react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
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
  const { isAdmin, loading: authLoading, token } = useAdminAuth()
  const [mounted, setMounted] = useState(false)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const [editFormData, setEditFormData] = useState({
    status: '',
    price: '',
    validUntil: '',
    description: '',
  })

  useEffect(() => {
    setMounted(true)
    return () => {
      setShowEditModal(false)
      setSelectedQuote(null)
      setMounted(false)
    }
  }, [])

  // Close modals on route change
  const pathname = usePathname()
  useEffect(() => {
    setShowEditModal(false)
    setSelectedQuote(null)
  }, [pathname])

  useEffect(() => {
    if (!authLoading && isAdmin && token) {
      fetchQuotes()
    }
  }, [pagination.page, searchTerm, statusFilter, authLoading, isAdmin, token])

  const fetchQuotes = async () => {
    if (!token) return
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/admin/quotes?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      
      if (response.ok) {
        setQuotes(data.quotes)
        setPagination(data.pagination)
        setError('')
      } else {
        setError(data.error || 'Failed to fetch quotes')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote)
    setEditFormData({
      status: quote.status,
      price: quote.price?.toString() || '',
      validUntil: quote.validUntil ? quote.validUntil.split('T')[0] : '',
      description: quote.description || '',
    })
    setShowEditModal(true)
  }

  const handleUpdateQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuote || !token) return

    try {
      const response = await fetch(`/api/admin/quotes/${selectedQuote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editFormData,
          price: editFormData.price ? parseFloat(editFormData.price) : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        fetchQuotes()
        setShowEditModal(false)
        setSelectedQuote(null)
      } else {
        alert(data.error || 'Update failed')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  const handleDelete = async (quote: Quote) => {
    if (!confirm(`Are you sure you want to delete quote from ${quote.user.name}?`) || !token) return

    try {
      const response = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        fetchQuotes()
      } else {
        alert(data.error || 'Delete failed')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">Authenticating...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Quotes Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and manage customer quotes</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #c9a84c, #a0843e)' }}>
          <FileText size={16} />
          <span>{pagination.total} Total Quotes</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotes..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
              <p className="text-sm text-gray-500">Loading quotes...</p>
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
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Service</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Route</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Price</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Created</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
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
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} quotes
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Quote Modal */}
      <ClientOnly>
        {mounted && showEditModal && selectedQuote && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false) }}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Quote</h2>

              <form onSubmit={handleUpdateQuote} className="space-y-4">
                {/* Quote Details Display */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h3 className="font-medium text-gray-900">Quote Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Customer:</span>
                      <p className="font-medium">{selectedQuote.user.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Service:</span>
                      <p className="font-medium">{selectedQuote.service.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">From:</span>
                      <p className="font-medium">{selectedQuote.origin}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">To:</span>
                      <p className="font-medium">{selectedQuote.destination}</p>
                    </div>
                    {selectedQuote.weight && (
                      <div>
                        <span className="text-gray-500">Weight:</span>
                        <p className="font-medium">{selectedQuote.weight} kg</p>
                      </div>
                    )}
                    {selectedQuote.dimensions && (
                      <div>
                        <span className="text-gray-500">Dimensions:</span>
                        <p className="font-medium">{selectedQuote.dimensions}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editFormData.status}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="REVIEWED">Reviewed</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editFormData.price}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editFormData.validUntil}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #c9a84c, #a0843e)' }}
                  >
                    Update Quote
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