'use client'

import { useEffect, useState } from 'react'
import { 
  Ship, Plus, Search, Edit, Trash2, 
  Clock, Package, MapPin, User, Calendar, AlertTriangle
} from 'lucide-react'
import { useAdminAuth } from '../contexts/AdminAuthContext'

interface Shipment {
  id: string
  trackingNumber: string
  userId: string
  serviceId: string
  origin: string
  destination: string
  status: string
  estimatedDelivery: string | null
  actualDelivery: string | null
  carrier: string | null
  notes: string | null
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
  PREPARING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PROCESSING: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  SHIPPED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  IN_TRANSIT: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  IN_CUSTOMS: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  ARRIVED: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
}

export default function AdminShipmentsPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const [editFormData, setEditFormData] = useState({
    status: '',
    carrier: '',
    estimatedDelivery: '',
    actualDelivery: '',
    notes: '',
  })

  const [addFormData, setAddFormData] = useState({
    userId: '',
    serviceId: '',
    origin: '',
    destination: '',
    carrier: '',
    estimatedDelivery: '',
    notes: '',
  })
  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchShipments()
    }
  }, [pagination.page, searchTerm, statusFilter, authLoading, isAdmin])

  const fetchShipments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/admin/shipments?${params}`, {
        credentials: 'include',
      })

      const data = await response.json()
      
      if (response.ok) {
        setShipments(data.shipments)
        setPagination(data.pagination)
        setError('')
      } else {
        setError(data.error || 'Failed to fetch shipments')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setEditFormData({
      status: shipment.status,
      carrier: shipment.carrier || '',
      estimatedDelivery: shipment.estimatedDelivery ? shipment.estimatedDelivery.split('T')[0] : '',
      actualDelivery: shipment.actualDelivery ? shipment.actualDelivery.split('T')[0] : '',
      notes: shipment.notes || '',
    })
    setShowEditModal(true)
  }
  const handleUpdateShipment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShipment) return

    try {
      const response = await fetch(`/api/admin/shipments/${selectedShipment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editFormData),
      })

      const data = await response.json()

      if (response.ok) {
        fetchShipments()
        setShowEditModal(false)
        setSelectedShipment(null)
      } else {
        alert(data.error || 'Update failed')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(addFormData),
      })

      const data = await response.json()

      if (response.ok) {
        fetchShipments()
        setShowAddModal(false)
        setAddFormData({
          userId: '',
          serviceId: '',
          origin: '',
          destination: '',
          carrier: '',
          estimatedDelivery: '',
          notes: '',
        })
      } else {
        alert(data.error || 'Creation failed')
      }
    } catch (err) {
      alert('Network error')
    }
  }
  const handleDelete = async (shipment: Shipment) => {
    if (!confirm(`Are you sure you want to delete shipment ${shipment.trackingNumber}?`)) return

    try {
      const response = await fetch(`/api/admin/shipments/${shipment.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        fetchShipments()
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
          <h1 className="text-2xl font-bold text-gray-900">Shipments Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage customer shipments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
            <Ship size={16} />
            <span>{pagination.total} Total Shipments</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #1a3a5c, #2563eb)' }}
          >
            <Plus size={18} />
            New Shipment
          </button>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tracking number, customer, or location..."
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
            <option value="PREPARING">Preparing</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="IN_CUSTOMS">In Customs</option>
            <option value="ARRIVED">Arrived</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
              <p className="text-sm text-gray-500">Loading shipments...</p>
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
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Tracking</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Service</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Route</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Delivery</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {shipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-mono font-medium text-gray-900">{shipment.trackingNumber}</p>
                          {shipment.carrier && (
                            <p className="text-xs text-gray-500">{shipment.carrier}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <h4 className="font-medium text-gray-900">{shipment.user.name}</h4>
                          <p className="text-xs text-gray-400">{shipment.user.email}</p>
                          {shipment.user.companyName && (
                            <p className="text-xs text-blue-600">{shipment.user.companyName}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{shipment.service.name}</p>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 capitalize">
                            {shipment.service.type}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <p className="text-gray-900">{shipment.origin}</p>
                          <p className="text-gray-400">↓</p>
                          <p className="text-gray-900">{shipment.destination}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[shipment.status as keyof typeof statusColors]?.bg || 'bg-gray-50'} ${statusColors[shipment.status as keyof typeof statusColors]?.text || 'text-gray-600'} ${statusColors[shipment.status as keyof typeof statusColors]?.border || 'border-gray-200'}`}>
                          {shipment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          {shipment.actualDelivery ? (
                            <div>
                              <p className="text-green-600 font-medium">Delivered</p>
                              <p className="text-gray-500">{formatDate(shipment.actualDelivery)}</p>
                            </div>
                          ) : shipment.estimatedDelivery ? (
                            <div>
                              <p className="text-gray-500">Est.</p>
                              <p className="text-gray-900">{formatDate(shipment.estimatedDelivery)}</p>
                            </div>
                          ) : (
                            <p className="text-gray-400">Not set</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(shipment)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(shipment)}
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
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} shipments
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
      {/* Edit Modal */}
      {showEditModal && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Shipment</h2>

            <form onSubmit={handleUpdateShipment} className="space-y-4">
              {/* Shipment Details Display */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h3 className="font-medium text-gray-900">Shipment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tracking:</span>
                    <p className="font-mono font-medium">{selectedShipment.trackingNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Customer:</span>
                    <p className="font-medium">{selectedShipment.user.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Service:</span>
                    <p className="font-medium">{selectedShipment.service.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="font-medium">{formatDate(selectedShipment.createdAt)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div>
                    <span className="text-gray-500">From:</span>
                    <p className="font-medium">{selectedShipment.origin}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">To:</span>
                    <p className="font-medium">{selectedShipment.destination}</p>
                  </div>
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
                    <option value="PREPARING">Preparing</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="IN_CUSTOMS">In Customs</option>
                    <option value="ARRIVED">Arrived</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Carrier</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editFormData.carrier}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, carrier: e.target.value }))}
                    placeholder="e.g., DHL, FedEx, UPS"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editFormData.estimatedDelivery}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Actual Delivery</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editFormData.actualDelivery}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, actualDelivery: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Internal notes about the shipment..."
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
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                >
                  Update Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}