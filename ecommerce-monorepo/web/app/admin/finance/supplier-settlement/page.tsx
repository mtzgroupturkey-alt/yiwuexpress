'use client'

import { useState, useEffect } from 'react'
import {
  Building2, CheckCircle2, AlertCircle, RefreshCw,
  Search, ChevronRight, DollarSign, ExternalLink, Eye,
  X, FileText, Phone, Mail, MapPin, CreditCard, ArrowUpRight
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'
import Link from 'next/link'

interface SettlementOrder {
  id: string
  poNumber: string
  total: number
  paid: number
  balance: number
  status: string
  isPaid: boolean
  orderDate: string
  currency?: string
  exchangeRate?: number
  payments: Array<{
    id: string
    amount: number
    paymentDate: string
    paymentMethod: string
    referenceNumber: string | null
  }>
}

interface SettlementItem {
  id: string
  name: string
  supplierName?: string
  companyName: string
  contactPerson: string | null
  email: string | null
  phone: string | null
  address?: string | null
  taxId?: string | null
  paymentTerms: string
  totalOrders: number
  totalPurchased: number
  totalPaid: number
  balanceDue: number
  currency: string
  status?: string
  orders?: SettlementOrder[]
}

interface SettlementSummary {
  totalSuppliers: number
  totalPurchased: number
  totalPaid: number
  totalBalance: number
}

export default function SupplierSettlementPage() {
  const { dict, locale } = useAdminLocale()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<SettlementSummary | null>(null)
  const [suppliers, setSuppliers] = useState<SettlementItem[]>([])
  const [search, setSearch] = useState('')
  const [filterBalanceOnly, setFilterBalanceOnly] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<SettlementItem | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/finance/supplier-settlement')
      const json = await res.json()
      if (json.success && json.data) {
        setSummary(json.data.summary)
        setSuppliers(json.data.settlements)
      }
    } catch (err) {
      console.error('Error fetching settlements:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatCurrency = (val: number, cur: string = 'USD') => {
    return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: cur || 'USD',
      maximumFractionDigits: 2,
    }).format(val || 0)
  }

  const filtered = suppliers.filter((s) => {
    if (search) {
      const q = search.toLowerCase()
      const matchName = (s.name || '').toLowerCase().includes(q)
      const matchCompany = (s.companyName || '').toLowerCase().includes(q)
      const matchContact = (s.contactPerson || '').toLowerCase().includes(q)
      const matchEmail = (s.email || '').toLowerCase().includes(q)
      if (!matchName && !matchCompany && !matchContact && !matchEmail) return false
    }
    if (filterBalanceOnly && (s.balanceDue || 0) <= 0) return false
    return true
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <Link href="/admin/finance/overview" className="hover:text-blue-600">Finance</Link>
            <ChevronRight size={12} />
            <span className="text-gray-700">Supplier Settlement</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
            Supplier Settlement & Clearing
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor statement of account, total volume cleared, and pending payable balances per supplier.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-xl gap-1.5 text-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Link href="/admin/finance/accounts-payable">
            <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5">
              <Building2 size={14} />
              Open AP Invoices
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Active Suppliers</span>
            <div className="text-xl font-black text-gray-900 mt-1">{summary?.totalSuppliers || 0}</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-gray-400">Total registered partners</CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Invoiced Volume (USD)</span>
            <div className="text-xl font-black text-gray-900 mt-1">{formatCurrency(summary?.totalPurchased || 0, 'USD')}</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-gray-400">Cumulative converted PO total</CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Total Settled / Paid (USD)</span>
            <div className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(summary?.totalPaid || 0, 'USD')}</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-emerald-600/70">Cleared disbursements</CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Settlement (USD)</span>
            <div className="text-xl font-black text-amber-700 mt-1">{formatCurrency(summary?.totalBalance || 0, 'USD')}</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-amber-600/70">Outstanding balances</CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Supplier or Contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterBalanceOnly}
              onChange={(e) => setFilterBalanceOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Show only suppliers with outstanding balance
          </label>
        </div>
      </div>

      {/* Supplier Settlement Table */}
      <Card className="rounded-2xl border-gray-200/80 overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">No supplier settlement records match your criteria.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Terms</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Total Purchased</th>
                  <th className="py-3 px-4 text-right">Total Settled</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((sup) => (
                  <tr key={sup.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <span>{sup.name || sup.companyName || 'Unnamed Supplier'}</span>
                        {sup.companyName && sup.companyName !== sup.name && (
                          <span className="text-[10px] font-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {sup.companyName}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        {sup.email && <span>{sup.email}</span>}
                        {sup.phone && <span>• {sup.phone}</span>}
                        {!sup.email && !sup.phone && <span>No direct contact</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      <div className="font-medium text-gray-800">{sup.contactPerson || '—'}</div>
                      {sup.taxId && <div className="text-[10px] text-gray-400">Tax ID: {sup.taxId}</div>}
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[11px] font-semibold text-gray-500">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {sup.paymentTerms}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                      {sup.totalOrders}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-900">
                      {formatCurrency(sup.totalPurchased, sup.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-700 font-medium">
                      {formatCurrency(sup.totalPaid, sup.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className={"font-black " + (sup.balanceDue > 0 ? "text-amber-700" : "text-gray-400")}>
                        {formatCurrency(sup.balanceDue, sup.currency)}
                      </div>
                      <span className={"inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-full " + (sup.balanceDue === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                        {sup.balanceDue === 0 ? 'SETTLED' : 'OUTSTANDING'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSupplier(sup)}
                          className="rounded-xl text-[11px] h-8 px-3 gap-1.5 text-blue-700 bg-blue-50/60 border-blue-200 hover:bg-blue-100 font-semibold"
                        >
                          <Eye size={13} />
                          Details & POs
                        </Button>
                        <Link href={'/admin/finance/accounts-payable?search=' + encodeURIComponent(sup.name || '')}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-xl text-[11px] h-8 px-2 gap-1 text-gray-500 hover:text-gray-700"
                            title="Open Invoices in Accounts Payable"
                          >
                            <ArrowUpRight size={14} />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Supplier Settlement Details Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    {selectedSupplier.name || selectedSupplier.companyName}
                  </h2>
                  <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (selectedSupplier.balanceDue === 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
                    {selectedSupplier.balanceDue === 0 ? 'SETTLED' : 'OUTSTANDING BALANCE'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1.5">
                  {selectedSupplier.companyName && (
                    <span className="flex items-center gap-1"><Building2 size={12} /> {selectedSupplier.companyName}</span>
                  )}
                  {selectedSupplier.contactPerson && (
                    <span>Contact: {selectedSupplier.contactPerson}</span>
                  )}
                  {selectedSupplier.email && (
                    <span className="flex items-center gap-1"><Mail size={12} /> {selectedSupplier.email}</span>
                  )}
                  {selectedSupplier.phone && (
                    <span className="flex items-center gap-1"><Phone size={12} /> {selectedSupplier.phone}</span>
                  )}
                  {selectedSupplier.taxId && (
                    <span>Tax ID: {selectedSupplier.taxId}</span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSupplier(null)}
                className="rounded-full w-8 h-8 p-0 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Modal Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 pb-2">
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Total Orders</span>
                <span className="text-lg font-black text-gray-900">{selectedSupplier.totalOrders}</span>
              </div>
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Total Invoiced</span>
                <span className="text-lg font-black text-gray-900">{formatCurrency(selectedSupplier.totalPurchased, selectedSupplier.currency)}</span>
              </div>
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Total Settled</span>
                <span className="text-lg font-black text-emerald-700">{formatCurrency(selectedSupplier.totalPaid, selectedSupplier.currency)}</span>
              </div>
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">Balance Due</span>
                <span className="text-lg font-black text-amber-700">{formatCurrency(selectedSupplier.balanceDue, selectedSupplier.currency)}</span>
              </div>
            </div>

            {/* Purchase Orders List */}
            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Purchase Orders & Settlement History ({selectedSupplier.orders?.length || 0})
                </h3>
                <span className="text-xs text-gray-400">Payment Terms: {selectedSupplier.paymentTerms}</span>
              </div>

              {(!selectedSupplier.orders || selectedSupplier.orders.length === 0) ? (
                <div className="py-8 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl">
                  No purchase orders recorded for this supplier.
                </div>
              ) : (
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">PO Number</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Order Total</th>
                        <th className="py-2.5 px-3 text-right">Paid</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                        <th className="py-2.5 px-3 text-center">Settlement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedSupplier.orders.map((po) => {
                        const isFullyPaid = po.isPaid || (po.total > 0 && po.paid >= po.total)
                        const isPartial = !isFullyPaid && po.paid > 0
                        return (
                          <tr key={po.id} className="hover:bg-gray-50/50">
                            <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                              {po.poNumber}
                            </td>
                            <td className="py-2.5 px-3 text-gray-500">
                              {new Date(po.orderDate).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                                {po.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-gray-900">
                              {formatCurrency(po.total, po.currency || selectedSupplier.currency)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-700 font-medium">
                              {formatCurrency(po.paid, po.currency || selectedSupplier.currency)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                              {formatCurrency(po.balance, po.currency || selectedSupplier.currency)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={"inline-block px-2 py-0.5 rounded-full text-[10px] font-bold " + (
                                isFullyPaid
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isPartial
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              )}>
                                {isFullyPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'UNPAID'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <Link href={'/admin/finance/accounts-payable?search=' + encodeURIComponent(selectedSupplier.name || '')}>
                <Button size="sm" className="rounded-xl text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  <CreditCard size={14} />
                  Open in Accounts Payable (Record Payment)
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSupplier(null)}
                className="rounded-xl text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
