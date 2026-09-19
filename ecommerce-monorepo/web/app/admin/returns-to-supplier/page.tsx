'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  RotateCcw,
  Plus,
  Search,
  Filter,
  Package,
  Building2,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  Eye,
  X,
  FileText,
  Warehouse as WarehouseIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAdminLocale } from '../contexts/AdminLocaleContext'

interface SupplierReturnItem {
  id?: string
  productId: string
  product?: {
    id: string
    name: string
    sku: string
  }
  quantity: number
  unitPrice: number
  totalAmount: number
  reason?: string
}

interface SupplierReturn {
  id: string
  returnNumber: string
  supplierId: string
  supplier?: {
    id: string
    name: string
    companyName?: string | null
  }
  warehouseId: string
  warehouse?: {
    id: string
    name: string
    code: string
  }
  purchaseOrderId?: string | null
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'SHIPPED' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED'
  totalAmount: number
  reason: string
  refundMethod: 'STORE_CREDIT' | 'BANK_TRANSFER' | 'REPLACE_GOODS' | 'ORIGINAL_PAYMENT'
  notes?: string | null
  items: SupplierReturnItem[]
  createdAt: string
  updatedAt: string
}

const statusBadgeStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-300',
  SHIPPED: 'bg-purple-100 text-purple-800 border-purple-300',
  RECEIVED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
}

export default function AdminReturnsToSupplierPage() {
  const router = useRouter()
  const { dict, locale } = useAdminLocale()

  const [returns, setReturns] = useState<SupplierReturn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<SupplierReturn | null>(null)

  // Form state for creating return
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    supplierId: '',
    warehouseId: '',
    reason: 'Defective Quality / Factory Recall',
    refundMethod: 'STORE_CREDIT',
    notes: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0, reason: '' }],
  })

  useEffect(() => {
    fetchReturns()
    fetchSuppliers()
    fetchProducts()
  }, [])

  const fetchReturns = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/admin/returns-to-supplier', { headers })
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setReturns(data.data)
      } else {
        setReturns([])
      }
    } catch (err) {
      console.error('Failed to load supplier returns:', err)
      setReturns([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/admin/suppliers')
      const data = await res.json()
      if (data.suppliers) {
        setSuppliers(data.suppliers)
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products?limit=100')
      const data = await res.json()
      if (data.products) {
        setProducts(data.products)
      }
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0, reason: '' }],
    })
  }

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return
    const nextItems = [...formData.items]
    nextItems.splice(index, 1)
    setFormData({ ...formData, items: nextItems })
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const nextItems = [...formData.items]
    nextItems[index] = { ...nextItems[index], [field]: value }

    // Auto fill unit price if product is selected
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value)
      if (prod) {
        nextItems[index].unitPrice = prod.costPrice || prod.price || 0
      }
    }

    setFormData({ ...formData, items: nextItems })
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.supplierId) {
      alert('Please select a supplier')
      return
    }
    const validItems = formData.items.filter((i) => i.productId && i.quantity > 0)
    if (!validItems.length) {
      alert('Please add at least one product to return')
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/returns-to-supplier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          ...formData,
          items: validItems,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        setIsCreateOpen(false)
        setFormData({
          supplierId: '',
          warehouseId: '',
          reason: 'Defective Quality / Factory Recall',
          refundMethod: 'STORE_CREDIT',
          notes: '',
          items: [{ productId: '', quantity: 1, unitPrice: 0, reason: '' }],
        })
        fetchReturns()
      } else {
        alert(json.error || 'Failed to create return to supplier')
      }
    } catch (err) {
      console.error('Error creating supplier return:', err)
      alert('Failed to submit return request')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Statistics calculation
  const totalReturnsCount = returns.length
  const pendingCount = returns.filter((r) => r.status === 'PENDING' || r.status === 'DRAFT').length
  const approvedCount = returns.filter((r) => r.status === 'APPROVED' || r.status === 'SHIPPED').length
  const totalReturnValue = returns.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0)

  // Filtered returns
  const filteredReturns = returns.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      item.returnNumber.toLowerCase().includes(q) ||
      (item.supplier?.name && item.supplier.name.toLowerCase().includes(q)) ||
      (item.supplier?.companyName && item.supplier.companyName.toLowerCase().includes(q)) ||
      item.reason.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>{dict.nav.buying || 'Procurement'}</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              {dict.nav.returnsToSupplier || 'Returns to Supplier'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-indigo-600" />
            {dict.nav.returnsToSupplier || 'Returns to Supplier'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Initiate supplier RMAs, defective returns to Chinese manufacturers, and track warehouse stock deductions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Supplier Return</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Returns</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalReturnsCount}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Review</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{pendingCount}</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approved / In Transit</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{approvedCount}</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Returned Value</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">${totalReturnValue.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <Input
                placeholder="Search return #, supplier, reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Status:</span>
              {['ALL', 'DRAFT', 'PENDING', 'APPROVED', 'SHIPPED', 'COMPLETED', 'CANCELLED'].map((st) => (
                <Button
                  key={st}
                  size="sm"
                  variant={statusFilter === st ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(st)}
                  className={`text-xs h-8 px-3 ${statusFilter === st ? 'bg-indigo-600' : ''}`}
                >
                  {st}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returns Data Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-gray-500 space-y-2">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
              <p>Loading returns to supplier...</p>
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <RotateCcw className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-800">No Supplier Returns Found</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                {search || statusFilter !== 'ALL'
                  ? 'No supplier returns match your active filter criteria.'
                  : 'No supplier return orders have been created yet.'}
              </p>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(true)}
                className="mt-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create First Return
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b">
                  <tr>
                    <th className="py-3.5 px-4">Return #</th>
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4">Origin Hub</th>
                    <th className="py-3.5 px-4">Items</th>
                    <th className="py-3.5 px-4">Refund Mode</th>
                    <th className="py-3.5 px-4 text-right">Total Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReturns.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-indigo-600">
                        {item.returnNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {item.supplier?.companyName || item.supplier?.name || 'Unknown Supplier'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {item.warehouse?.name || 'China Central DC'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                          {item.items?.length || 0} item{(item.items?.length || 0) > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-600">
                        {item.refundMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900">
                        ${Number(item.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-semibold px-2.5 py-0.5 border ${
                            statusBadgeStyles[item.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedReturn(item)}
                          className="h-8 px-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: New Supplier Return */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-900">Create Supplier Return (RMA)</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Select Supplier *
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName || s.name} ({s.country || 'China'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Refund / Settlement Method
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                    value={formData.refundMethod}
                    onChange={(e) => setFormData({ ...formData, refundMethod: e.target.value as any })}
                  >
                    <option value="STORE_CREDIT">Store Credit / Ledger Offset</option>
                    <option value="BANK_TRANSFER">Direct Bank Refund</option>
                    <option value="REPLACE_GOODS">Replace with Defect-free Goods</option>
                    <option value="ORIGINAL_PAYMENT">Original Payment Method</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Return Reason *
                </label>
                <Input
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Defective stitching, missing packaging, wrong SKU delivered"
                  required
                />
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">
                    Products to Return (Deducted from Central Stock)
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddItem}
                    className="text-xs h-7 px-2 text-indigo-600"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Line Item
                  </Button>
                </div>

                <div className="border rounded-md divide-y max-h-56 overflow-y-auto">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center gap-3 bg-gray-50/50">
                      <div className="flex-1">
                        <select
                          className="w-full border border-gray-300 rounded-md p-1.5 text-xs bg-white"
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          required
                        >
                          <option value="">-- Choose Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku || 'No SKU'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          className="h-8 text-xs"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          required
                        />
                      </div>

                      <div className="w-24">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Unit $"
                          className="h-8 text-xs"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={formData.items.length <= 1}
                        className="text-gray-400 hover:text-red-600 disabled:opacity-30 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Internal Notes & Forwarder Instructions
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes or supplier RMA tracking instructions..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating RMA...' : 'Confirm Supplier Return'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Return Details */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-mono font-semibold text-indigo-600">
                  {selectedReturn.returnNumber}
                </span>
                <h3 className="text-lg font-bold text-gray-900">Return to Supplier Details</h3>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg text-xs">
              <div>
                <span className="text-gray-500 block">Supplier</span>
                <span className="font-semibold text-gray-900">
                  {selectedReturn.supplier?.companyName || selectedReturn.supplier?.name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Warehouse</span>
                <span className="font-semibold text-gray-900">
                  {selectedReturn.warehouse?.name || 'China Central DC'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Current Status</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] mt-0.5 ${statusBadgeStyles[selectedReturn.status]}`}
                >
                  {selectedReturn.status}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500 block">Settlement Method</span>
                <span className="font-semibold text-gray-900">
                  {selectedReturn.refundMethod.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Reason</span>
                <span className="font-semibold text-gray-900">{selectedReturn.reason}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Total Refund Value</span>
                <span className="font-bold text-emerald-600 text-sm">
                  ${Number(selectedReturn.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Itemized list */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Item Breakdown</h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-600 border-b font-semibold">
                    <tr>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5">SKU</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedReturn.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2.5 font-medium text-gray-900">
                          {item.product?.name || 'Product'}
                        </td>
                        <td className="p-2.5 font-mono text-gray-500">{item.product?.sku || '—'}</td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-semibold text-gray-900">
                          ${Number(item.totalAmount || item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedReturn.notes && (
              <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-800">
                <span className="font-semibold block mb-1">Notes:</span>
                {selectedReturn.notes}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t">
              <Button onClick={() => setSelectedReturn(null)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
