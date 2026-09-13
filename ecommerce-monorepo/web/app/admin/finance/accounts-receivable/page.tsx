'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard, Clock, CheckCircle2, AlertCircle, RefreshCw,
  Download, Search, ChevronRight, User, Building2
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'
import Link from 'next/link'

interface ArItem {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  companyName: string | null
  total: number
  paidAmount: number
  balanceDue: number
  currency: string
  orderDate: string
  status: string
  paymentStatus: string
  ageDays: number
}

interface ArSummary {
  totalAr: number
  aging0to30: number
  aging31to60: number
  aging61to90: number
  aging90Plus: number
  count: number
}

export default function AccountsReceivablePage() {
  const { dict, locale } = useAdminLocale()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<ArSummary | null>(null)
  const [items, setItems] = useState<ArItem[]>([])
  const [filterAge, setFilterAge] = useState<'ALL' | '0-30' | '31-60' | '61-90' | '90+'>('ALL')
  const [search, setSearch] = useState('')
  const [payingOrder, setPayingOrder] = useState<ArItem | null>(null)
  const [payAmount, setPayAmount] = useState<string>('')
  const [payMethod, setPayMethod] = useState('bank_transfer')
  const [payRef, setPayRef] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/finance/accounts-receivable')
      const json = await res.json()
      if (json.success && json.data) {
        setSummary(json.data.summary)
        setItems(json.data.items)
      }
    } catch (err) {
      console.error('Error fetching AR:', err)
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

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payingOrder || !payAmount) return
    setSubmittingPayment(true)
    try {
      const res = await fetch('/api/admin/finance/customer-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: payingOrder.id,
          amount: parseFloat(payAmount),
          currency: payingOrder.currency,
          paymentMethod: payMethod,
          reference: payRef || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setPayingOrder(null)
        setPayAmount('')
        setPayRef('')
        fetchData()
      } else {
        alert(json.error || 'Payment failed')
      }
    } catch (err: any) {
      alert(err.message || 'Payment error')
    } finally {
      setSubmittingPayment(false)
    }
  }

  const filteredItems = items.filter((item) => {
    if (search) {
      const q = search.toLowerCase()
      const matchOrder = item.orderNumber.toLowerCase().includes(q)
      const matchName = item.customerName.toLowerCase().includes(q)
      const matchEmail = item.customerEmail.toLowerCase().includes(q)
      const matchCompany = (item.companyName || '').toLowerCase().includes(q)
      if (!matchOrder && !matchName && !matchEmail && !matchCompany) return false
    }
    if (filterAge === '0-30') return item.ageDays <= 30
    if (filterAge === '31-60') return item.ageDays > 30 && item.ageDays <= 60
    if (filterAge === '61-90') return item.ageDays > 60 && item.ageDays <= 90
    if (filterAge === '90+') return item.ageDays > 90
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
            <span className="text-gray-700">Accounts Receivable</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
            Accounts Receivable (AR)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track outstanding customer invoices, overdue balances, and debt aging buckets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-xl gap-1.5 text-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Link href="/admin/customers">
            <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5">
              <User size={14} />
              Customers
            </Button>
          </Link>
        </div>
      </div>

      {/* Aging Breakdown Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className={"rounded-2xl cursor-pointer transition-all " + (filterAge === 'ALL' ? 'ring-2 ring-blue-500 bg-blue-50/20' : '')} onClick={() => setFilterAge('ALL')}>
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total AR</span>
            <div className="text-xl font-black text-gray-900 mt-1">{formatCurrency(summary?.totalAr || 0)}</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-gray-400">{summary?.count || 0} open orders</CardContent>
        </Card>

        <Card className={"rounded-2xl cursor-pointer transition-all " + (filterAge === '0-30' ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : '')} onClick={() => setFilterAge('0-30')}>
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Current (0-30d)</span>
            <div className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(summary?.aging0to30 || 0)}</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-emerald-600/70">Current</CardContent>
        </Card>

        <Card className={"rounded-2xl cursor-pointer transition-all " + (filterAge === '31-60' ? 'ring-2 ring-amber-500 bg-amber-50/20' : '')} onClick={() => setFilterAge('31-60')}>
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">31-60 Days</span>
            <div className="text-xl font-black text-amber-700 mt-1">{formatCurrency(summary?.aging31to60 || 0)}</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-amber-600/70">Due soon</CardContent>
        </Card>

        <Card className={"rounded-2xl cursor-pointer transition-all " + (filterAge === '61-90' ? 'ring-2 ring-orange-500 bg-orange-50/20' : '')} onClick={() => setFilterAge('61-90')}>
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">61-90 Days</span>
            <div className="text-xl font-black text-orange-700 mt-1">{formatCurrency(summary?.aging61to90 || 0)}</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-orange-600/70">Overdue</CardContent>
        </Card>

        <Card className={"rounded-2xl cursor-pointer transition-all " + (filterAge === '90+' ? 'ring-2 ring-red-500 bg-red-50/20' : '')} onClick={() => setFilterAge('90+')}>
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">90+ Days</span>
            <div className="text-xl font-black text-red-700 mt-1">{formatCurrency(summary?.aging90Plus || 0)}</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-red-600/70">Severely overdue</CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Order # or Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* AR Table */}
      <Card className="rounded-2xl border-gray-200/80 overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">No accounts receivable records match your filter.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Order Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Aging</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-bold text-blue-600">
                      <Link href={'/admin/orders/' + ord.id} className="hover:underline">
                        {ord.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{ord.customerName}</div>
                      <div className="text-[11px] text-gray-400">{ord.companyName || ord.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold " + (
                        ord.paymentStatus === 'PARTIALLY_PAID'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      )}>
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(ord.total, ord.currency)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-medium">{formatCurrency(ord.paidAmount, ord.currency)}</td>
                    <td className="py-3 px-4 text-right font-black text-rose-700">{formatCurrency(ord.balanceDue, ord.currency)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold " + (
                        ord.ageDays <= 30
                          ? 'bg-emerald-50 text-emerald-700'
                          : ord.ageDays <= 60
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      )}>
                        {ord.ageDays}d
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setPayingOrder(ord)
                          setPayAmount(ord.balanceDue.toString())
                        }}
                        className="rounded-xl text-[11px] h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Record Payment
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {payingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Record Customer Payment</h3>
            <p className="text-xs text-gray-500">
              Order: <span className="font-bold text-gray-800">{payingOrder.orderNumber}</span> | Customer: <span className="font-bold text-gray-800">{payingOrder.customerName}</span>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Amount ({payingOrder.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  max={payingOrder.balanceDue}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Reference / Transaction #</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-10928"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setPayingOrder(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submittingPayment} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                  {submittingPayment ? 'Saving...' : 'Confirm Receipt'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
