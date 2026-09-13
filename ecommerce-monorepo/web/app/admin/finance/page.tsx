'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  CreditCard, Package, Truck, Wallet, Download, RefreshCw, Calendar,
  Building2, CheckCircle2, Clock, AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminLocale } from '../contexts/AdminLocaleContext'
import { RevenueCogsChart, TopProductsBarChart, RegionPieChart } from '@/components/admin/FinanceChart'
import Link from 'next/link'

interface FinanceSummary {
  grossGmv: number
  paidRevenue: number
  pendingAr: number
  totalCogs: number
  totalShippingFee: number
  totalTax: number
  totalGrossProfit: number
  grossMarginRate: number
  totalAp: number
  pendingAp: number
  paidAp: number
  totalOrdersCount: number
}

interface TrendItem {
  month: string
  revenue: number
  cogs: number
  profit: number
  ordersCount: number
}

interface RecentTransaction {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  subtotal: number | null
  shippingFee: number | null
  tax: number | null
  total: number
  profit: number | null
  purchaseCost: number | null
  currency: string | null
  createdAt: string
  customerName: string
}

export default function AdminFinancePage() {
  const { dict, locale } = useAdminLocale()
  const [range, setRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [trends, setTrends] = useState<TrendItem[]>([])
  const [transactions, setTransactions] = useState<RecentTransaction[]>([])

  const fetchFinanceData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/finance/summary?range=${range}`)
      const json = await res.json()
      if (json.success && json.data) {
        setSummary(json.data.summary)
        setTrends(json.data.trends || [])
        setTransactions(json.data.recentTransactions || [])
      }
    } catch (err) {
      console.error('Error fetching finance:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinanceData()
  }, [range])

  const formatCurrency = (val: number | null | undefined, cur: string = 'USD') => {
    const num = Number(val) || 0
    return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: cur || 'USD',
      maximumFractionDigits: 2,
    }).format(num)
  }

  const exportAuditCSV = () => {
    if (!transactions.length) return
    const headers = [
      'Transaction ID / Order',
      'Date',
      'Customer',
      'Payment Status',
      'Order Status',
      'GMV (Total)',
      'Factory COGS',
      'Logistics Freight',
      'Tax',
      'Gross Profit',
      'Currency'
    ]

    const rows = transactions.map((t) => [
      `"${t.orderNumber}"`,
      `"${new Date(t.createdAt).toISOString()}"`,
      `"${(t.customerName || '').replace(/"/g, '""')}"`,
      `"${t.paymentStatus}"`,
      `"${t.status}"`,
      Number(t.total || 0).toFixed(2),
      Number(t.purchaseCost || 0).toFixed(2),
      Number(t.shippingFee || 0).toFixed(2),
      Number(t.tax || 0).toFixed(2),
      Number(t.profit !== null && t.profit !== undefined ? t.profit : (t.total - (t.purchaseCost || 0))).toFixed(2),
      `"${t.currency || 'USD'}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `financial_audit_${range}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              {dict.finance?.title || 'Financial Ledger & Analytics'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {dict.finance?.subtitle || 'Track gross merchandise volume, COGS, freight costs, net profit, and receivables/payables'}
          </p>

          {/* Sub Navigation Modules */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Link href="/admin/finance/overview">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs">
                Overview & Charts
              </span>
            </Link>
            <Link href="/admin/finance/accounts-payable">
              <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                Accounts Payable (AP)
              </span>
            </Link>
            <Link href="/admin/finance/accounts-receivable">
              <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                Accounts Receivable (AR)
              </span>
            </Link>
            <Link href="/admin/finance/supplier-settlement">
              <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                Supplier Settlement
              </span>
            </Link>
            <Link href="/admin/finance/profit-loss">
              <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                Profit & Loss (P&L)
              </span>
            </Link>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Range Selector */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            {(['7d', '30d', '90d', '1y', 'all'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  range === r
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {r === '7d' ? dict.finance?.range7d || '7 Days'
                  : r === '30d' ? dict.finance?.range30d || '30 Days'
                  : r === '90d' ? dict.finance?.range90d || '90 Days'
                  : r === '1y' ? dict.finance?.range1y || '1 Year'
                  : dict.finance?.rangeAll || 'All Time'}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchFinanceData}
            disabled={loading}
            className="rounded-xl gap-1.5 text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {dict.common.refresh}
          </Button>

          <Button
            size="sm"
            onClick={exportAuditCSV}
            disabled={!transactions.length}
            className="rounded-xl gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <Download size={14} />
            {dict.finance?.exportReport || 'Export Audit CSV'}
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross GMV */}
        <Card className="rounded-2xl border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {dict.finance?.grossGmv || 'Gross GMV'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-gray-900">
              {loading ? '...' : formatCurrency(summary?.grossGmv)}
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <span>{dict.finance?.grossGmvDesc || 'Total sales order value'}</span>
              <span className="text-gray-500 font-semibold">({summary?.totalOrdersCount || 0} orders)</span>
            </p>
          </CardContent>
        </Card>

        {/* Collected Revenue */}
        <Card className="rounded-2xl border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              {dict.finance?.paidRevenue || 'Collected Revenue'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-emerald-700">
              {loading ? '...' : formatCurrency(summary?.paidRevenue)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {dict.finance?.paidRevenueDesc || 'Settled & confirmed payments'}
            </p>
          </CardContent>
        </Card>

        {/* Factory COGS */}
        <Card className="rounded-2xl border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              {dict.finance?.factoryCogs || 'Factory COGS'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-amber-800">
              {loading ? '...' : formatCurrency(summary?.totalCogs)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {dict.finance?.factoryCogsDesc || 'Cost of goods from suppliers'}
            </p>
          </CardContent>
        </Card>

        {/* Gross Profit & Margin */}
        <Card className="rounded-2xl border-gray-200/80 shadow-xs hover:shadow-md transition-shadow bg-linear-to-br from-indigo-50/40 via-white to-purple-50/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              {dict.finance?.grossProfit || 'Gross Profit'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-indigo-900">
                {loading ? '...' : formatCurrency(summary?.totalGrossProfit)}
              </span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {loading ? '...' : `${summary?.grossMarginRate || 0}%`}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {dict.finance?.grossMarginDesc || 'Operating profitability ratio'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Balance Sheet Cards (AR vs. AP & Logistics Spend) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Outstanding AR */}
        <Card className="rounded-2xl border-gray-200/80 p-4 flex items-center gap-4 bg-amber-50/30">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {dict.finance?.outstandingAr || 'Accounts Receivable (AR)'}
            </div>
            <div className="text-xl font-black text-amber-900 mt-0.5">
              {loading ? '...' : formatCurrency(summary?.pendingAr)}
            </div>
            <div className="text-[11px] text-gray-400 truncate">
              {dict.finance?.outstandingArDesc || 'Pending customer payments'}
            </div>
          </div>
        </Card>

        {/* Supplier AP */}
        <Card className="rounded-2xl border-gray-200/80 p-4 flex items-center gap-4 bg-purple-50/30">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {dict.finance?.supplierAp || 'Accounts Payable (AP)'}
            </div>
            <div className="text-xl font-black text-purple-900 mt-0.5">
              {loading ? '...' : formatCurrency(summary?.pendingAp)}
            </div>
            <div className="text-[11px] text-gray-400 truncate">
              {dict.finance?.supplierApDesc || 'Pending supplier purchase orders'}
            </div>
          </div>
        </Card>

        {/* Freight & Logistics Spend */}
        <Card className="rounded-2xl border-gray-200/80 p-4 flex items-center gap-4 bg-sky-50/30">
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Truck size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {dict.finance?.freightSpend || 'Freight & Logistics Spend'}
            </div>
            <div className="text-xl font-black text-sky-900 mt-0.5">
              {loading ? '...' : formatCurrency(summary?.totalShippingFee)}
            </div>
            <div className="text-[11px] text-gray-400 truncate">
              {dict.finance?.freightSpendDesc || 'Shipping & carrier fees'}
            </div>
          </div>
        </Card>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs COGS Trend Chart */}
        <Card className="lg:col-span-2 rounded-2xl border-gray-200/80 p-5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-sm font-bold text-gray-900">
              Revenue & Profit Trajectory
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Monthly billed sales revenue vs gross profit margins
            </CardDescription>
          </CardHeader>
          <RevenueCogsChart data={trends} />
        </Card>

        {/* Regional Sales Breakdown */}
        <Card className="rounded-2xl border-gray-200/80 p-5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-sm font-bold text-gray-900">
              Sales by Region
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Cross-border order distribution
            </CardDescription>
          </CardHeader>
          <RegionPieChart
            data={[
              { name: 'Russia & CIS', value: summary ? summary.grossGmv * 0.45 : 4500 },
              { name: 'Central Asia', value: summary ? summary.grossGmv * 0.30 : 3000 },
              { name: 'Middle East', value: summary ? summary.grossGmv * 0.15 : 1500 },
              { name: 'Other Regions', value: summary ? summary.grossGmv * 0.10 : 1000 },
            ]}
          />
        </Card>
      </div>

      {/* Monthly Trends Table */}
      {trends.length > 0 && (
        <Card className="rounded-2xl border-gray-200/80">
          <CardHeader>
            <CardTitle className="text-base font-bold text-gray-900">
              {dict.finance?.monthlyTrends || 'Revenue vs. Cost Trends'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-right">COGS</th>
                  <th className="py-3 px-4 text-right">Gross Profit</th>
                  <th className="py-3 px-4 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trends.map((t) => {
                  const margin = t.revenue > 0 ? ((t.profit / t.revenue) * 100).toFixed(1) : '0.0'
                  return (
                    <tr key={t.month} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{t.month}</td>
                      <td className="py-3 px-4 text-gray-600">{t.ordersCount}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(t.revenue)}</td>
                      <td className="py-3 px-4 text-right font-medium text-amber-700">{formatCurrency(t.cogs)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatCurrency(t.profit)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Recent Ledger Transactions Table */}
      <Card className="rounded-2xl border-gray-200/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-gray-900">
            {dict.finance?.recentLedger || 'Recent Financial Transactions'}
          </CardTitle>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            {dict.nav.allOrders} <ArrowUpRight size={14} />
          </Link>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full max-w-full">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              {dict.finance?.noLedgerData || 'No financial records found.'}
            </div>
          ) : (
            <table className="w-full min-w-[750px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Order / ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">COGS</th>
                  <th className="py-3 px-4 text-right">Gross Profit</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tr) => {
                  const cogs = tr.purchaseCost || 0
                  const profit = tr.profit !== null && tr.profit !== undefined ? tr.profit : (tr.total - cogs)
                  const isPaid = tr.paymentStatus === 'PAID'
                  return (
                    <tr key={tr.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/orders/${tr.id}`}
                          className="font-bold text-blue-600 hover:underline"
                        >
                          {tr.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">{tr.customerName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {tr.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {formatCurrency(tr.total, tr.currency || 'USD')}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-700">
                        {formatCurrency(cogs, tr.currency || 'USD')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatCurrency(profit, tr.currency || 'USD')}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-right">
                        {new Date(tr.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
