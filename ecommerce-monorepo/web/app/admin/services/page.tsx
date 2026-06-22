'use client'

import { useEffect, useState } from 'react'
import { 
  Package, Plus, Search, Edit, Trash2, Eye, 
  Filter, MoreVertical, Check, X, AlertTriangle 
} from 'lucide-react'
import { useAdminAuth } from '../contexts/AdminAuthContext'

interface Service {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  duration: string | null
  coverage: string | null
  type: string
  image: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function AdminServicesPage() {
  const { isAdmin, loading: authLoading, token } = useAdminAuth()
  const [services, setServices] = useState<Service[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    duration: '',
    coverage: '',
    type: 'shipping',
    image: '',
  })

  useEffect(() => {
    if (!authLoading && isAdmin && token) {
      fetchServices()
    }
  }, [pagination.page, searchTerm, typeFilter, authLoading, isAdmin, token])

  const fetchServices = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter) params.append('type', typeFilter)

      const response = await fetch(`/api/admin/services?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      
      if (response.ok) {
        setServices(data.services)
        setPagination(data.pagination)
        setError('')
      } else {
        setError(data.error || 'Failed to fetch services')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    
    try {
      const method = editingService ? 'PUT' : 'POST'
      const url = editingService 
        ? `/api/admin/services/${editingService.id}`
        : '/api/admin/services'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        fetchServices()
        setShowAddModal(false)
        setEditingService(null)
        setFormData({
          name: '',
          slug: '',
          description: '',
          price: '',
          duration: '',
          coverage: '',
          type: 'shipping',
          image: '',
        })
      } else {
        alert(data.error || 'Operation failed')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      slug: service.slug,
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration || '',
      coverage: service.coverage || '',
      type: service.type,
      image: service.image || '',
    })
    setShowAddModal(true)
  }

  const handleDelete = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) return
    if (!token) return

    try {
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        fetchServices()
        if (data.message.includes('deactivated')) {
          alert('Service deactivated due to existing quotes/shipments')
        }
      } else {
        alert(data.error || 'Delete failed')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      duration: '',
      coverage: '',
      type: 'shipping',
      image: '',
    })
    setEditingService(null)
    setShowAddModal(false)
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
          <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage shipping, customs, warehousing, and sourcing services</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #1a3a5c, #2563eb)' }}
        >
          <Plus size={18} />
          Add Service
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="shipping">Shipping</option>
            <option value="customs">Customs</option>
            <option value="warehousing">Warehousing</option>
            <option value="sourcing">Sourcing</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
              <p className="text-sm text-gray-500">Loading services...</p>
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
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Service</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Price</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Duration</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <h4 className="font-medium text-gray-900">{service.name}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">{service.slug}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-medium capitalize px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                          {service.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-sm">${service.price}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{service.duration || 'N/A'}</td>
                      <td className="py-4 px-6">
                        {service.isActive ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <Check size={12} />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                            <X size={12} />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(service)}
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
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} services
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g., 3-5 days"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="shipping">Shipping</option>
                    <option value="customs">Customs</option>
                    <option value="warehousing">Warehousing</option>
                    <option value="sourcing">Sourcing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coverage</label>
                <input
                  type="text"
                  placeholder="e.g., Global, Asia-Pacific"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.coverage}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverage: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #1a3a5c, #2563eb)' }}
                >
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}