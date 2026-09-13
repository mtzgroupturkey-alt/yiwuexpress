'use client'

import React, { useState, useEffect } from 'react'
import {
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Search,
  PlusCircle,
  Filter,
  CheckCircle2,
  AlertCircle,
  Warehouse as WarehouseIcon,
  Layers,
  AlertTriangle,
} from 'lucide-react'

interface StockMovement {
  id: string
  type: string
  quantity: number
  unitCost: number | null
  reference: string | null
  notes: string | null
  createdAt: string
  product: {
    id: string
    name: string
    sku: string
    stock: number
  } | null
  variant: {
    id: string
    sku: string
    stock: number
  } | null
}

interface WarehouseStock {
  id: string
  warehouseId: string
  quantity: number
  reservedQty: number
  availableQty: number
  avgCost: number
  reorderPoint: number
  isLowStock: boolean
  warehouse: {
    id: string
    name: string
    code: string
    country: string
  }
  slot: {
    id: string
    code: string
    bay: {
      code: string
      zone: {
        code: string
        name: string
      }
    }
  } | null
  product: {
    id: string
    name: string
    sku: string
    stock: number
    costPrice: number | null
    price: number
    weightKg: number
  }
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'stocks' | 'movements'>('stocks')

  // Stocks tab state
  const [stocks, setStocks] = useState<WarehouseStock[]>([])
  const [stocksLoading, setStocksLoading] = useState(true)
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [stockSearch, setStockSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  // Movements tab state
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [adjustProductId, setAdjustProductId] = useState('')
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0)
  const [adjustReason, setAdjustReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchStocks = async () => {
    try {
      setStocksLoading(true)
      const params = new URLSearchParams()
      if (warehouseFilter) params.append('warehouseId', warehouseFilter)
      if (stockSearch) params.append('search', stockSearch)
      if (lowStockOnly) params.append('lowStockOnly', 'true')

      const res = await fetch(`/api/admin/inventory?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setStocks(data.data || [])
      }
    } catch (err) {
      console.error('Failed to load warehouse stocks', err)
    } finally {
      setStocksLoading(false)
    }
  }

  const fetchMovements = async () => {
    try {
      setMovementsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (search) params.append('search', search)
      if (filterType) params.append('type', filterType)

      const res = await fetch(`/api/admin/inventory/movements?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setMovements(data.movements || [])
        setTotalPages(data.pagination?.pages || 1)
      }
    } catch (err) {
      console.error('Failed to load inventory movements', err)
    } finally {
      setMovementsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'stocks') {
      fetchStocks()
    } else {
      fetchMovements()
    }
  }, [activeTab, page, filterType, warehouseFilter, lowStockOnly])

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustProductId || adjustQuantity === 0) return

    try {
      setSubmitting(true)
      setMessage(null)
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustProductId,
          quantity: Number(adjustQuantity),
          reason: adjustReason,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Inventory adjusted successfully' })
        setIsAdjustModalOpen(false)
        setAdjustProductId('')
        setAdjustQuantity(0)
        setAdjustReason('')
        fetchStocks()
        fetchMovements()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to adjust stock' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error connecting to server' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-600" />
            Inventory & Multi-Warehouse Stock
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time stock balance across China & Belarus warehouses, 24h reservations, and ledger audit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Stock Adjustment
          </button>
          <button
            onClick={() => {
              if (activeTab === 'stocks') fetchStocks()
              else fetchMovements()
            }}
            className="inline-flex items-center p-2 border border-border rounded-lg text-foreground hover:bg-muted"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('stocks')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'stocks'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <WarehouseIcon className="w-4 h-4" />
          Multi-Warehouse Balances
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          Stock Movement Ledger
        </button>
      </div>

      {/* TAB 1: MULTI-WAREHOUSE STOCK BALANCES */}
      {activeTab === 'stocks' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                fetchStocks()
              }}
              className="flex items-center w-full sm:w-80 gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search product name or SKU..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
                />
              </div>
              <button type="submit" className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded-lg">
                Search
              </button>
            </form>

            <div className="flex items-center gap-4 flex-wrap w-full sm:w-auto">
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                Low Stock Alert Only
              </label>
            </div>
          </div>

          {/* Stocks Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm w-full max-w-full">
            <div className="overflow-x-auto w-full max-w-full">
              <table className="w-full min-w-[800px] divide-y divide-border text-left text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-foreground">Warehouse</th>
                    <th className="px-6 py-3 font-semibold text-foreground">Product / SKU</th>
                    <th className="px-6 py-3 font-semibold text-foreground">Location (Zone/Slot)</th>
                    <th className="px-6 py-3 font-semibold text-foreground text-right">Physical Stock</th>
                    <th className="px-6 py-3 font-semibold text-foreground text-right">Reserved (24h)</th>
                    <th className="px-6 py-3 font-semibold text-foreground text-right">Available</th>
                    <th className="px-6 py-3 font-semibold text-foreground text-right">Weighted Avg Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {stocksLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                        Loading warehouse inventory...
                      </td>
                    </tr>
                  ) : stocks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground text-xs">
                        No warehouse stock records found.
                      </td>
                    </tr>
                  ) : (
                    stocks.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/20 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-xs bg-muted px-2 py-0.5 rounded border border-border">
                            {s.warehouse.code}
                          </span>
                          <span className="text-xs text-muted-foreground block mt-0.5">{s.warehouse.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{s.product.name}</div>
                          <div className="text-xs font-mono text-muted-foreground">SKU: {s.product.sku}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono">
                          {s.slot ? (
                            <span className="text-indigo-600 font-medium">
                              {s.slot.bay.zone.code} &rarr; {s.slot.code}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">General Staging</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-foreground">
                          {s.quantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-amber-600 font-semibold">
                          {s.reservedQty.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-extrabold text-emerald-600">
                          {s.availableQty.toLocaleString()}
                          {s.isLowStock && (
                            <span className="inline-flex items-center ml-1.5 text-xs text-red-600" title="Low stock alert">
                              <AlertTriangle className="w-3.5 h-3.5 inline" />
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-foreground">
                          ${(s.avgCost || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK MOVEMENT LEDGER */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setPage(1)
                fetchMovements()
              }}
              className="flex items-center w-full sm:w-80 gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search reference or product..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
                />
              </div>
              <button type="submit" className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded-lg">
                Filter
              </button>
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value)
                  setPage(1)
                }}
                className="text-sm border border-input rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
              >
                <option value="">All Movement Types</option>
                <option value="PURCHASE_RECEIPT">PO Receive</option>
                <option value="CONTAINER_DISPATCH">Container Dispatch (China DC)</option>
                <option value="CONTAINER_RECEIPT">Container Receipt (Belarus DC)</option>
                <option value="ORDER_RESERVED">Order Reserved (24h)</option>
                <option value="ORDER_FULFILLED">Order Fulfilled</option>
                <option value="TRANSFER_OUT">Transfer Out</option>
                <option value="TRANSFER_IN">Transfer In</option>
                <option value="SUPPLIER_RETURN">Supplier Return</option>
                <option value="ADJUSTMENT">Manual Adjustment</option>
              </select>
            </div>
          </div>

          {/* Movements Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm w-full max-w-full">
            <div className="overflow-x-auto w-full max-w-full">
              <table className="w-full min-w-[800px] divide-y divide-border text-left text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-foreground">Date & Time</th>
                    <th className="px-6 py-3 font-semibold text-foreground">Product / SKU</th>
                    <th className="px-6 py-3 font-semibold text-foreground">Movement Type</th>
                    <th className="px-6 py-3 font-semibold text-foreground text-right">Quantity</th>
                    <th className="px-6 py-3 font-semibold text-foreground">Reference / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {movementsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                        Loading stock records...
                      </td>
                    </tr>
                  ) : movements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-xs">
                        No stock movements recorded yet.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/20 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-xs">
                          {new Date(m.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{m.product?.name || 'Product'}</div>
                          <div className="text-xs font-mono text-muted-foreground">SKU: {m.product?.sku || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                              m.type.includes('RECEIPT') || m.quantity > 0
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-right font-mono">
                          <span
                            className={`inline-flex items-center gap-1 ${
                              m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {m.quantity > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          <div className="font-semibold text-foreground font-mono">{m.reference || '—'}</div>
                          <div>{m.notes || '—'}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-border rounded text-xs disabled:opacity-50 hover:bg-muted text-foreground"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 border border-border rounded text-xs disabled:opacity-50 hover:bg-muted text-foreground"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-card rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-border">
            <h3 className="text-lg font-bold text-foreground">Manual Stock Adjustment</h3>
            <p className="text-xs text-muted-foreground">
              Increase or decrease product stock directly. All changes are logged to the audit ledger.
            </p>
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Product ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. clu123abc..."
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Adjustment Quantity</label>
                <input
                  type="number"
                  required
                  placeholder="Positive to add, negative to subtract"
                  value={adjustQuantity || ''}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Reason / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Physical inventory recount, damaged stock, etc."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Applying...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
