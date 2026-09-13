'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw,
  ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'
import Link from 'next/link'

interface PlData {
  period: { startDate: string | null; endDate: string | null; orderCount: number }
  revenue: { totalSalesRevenue: number; totalShippingRevenue: number; totalTaxCollected: number; grossRevenue: number }
  costOfGoodsSold: { totalCogs: number; grossProfit: number; grossMarginPercent: number }
  operatingExpenses: { totalOperatingExpenses: number }
  netIncome: { netIncome: number; netMarginPercent: number }
}

export default function ProfitLossPage() {
  const { dict, locale } = useAdminLocale()
  const [loading, setLoading] = useState(true)
  const [pl, setPl] = useState<PlData | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedMode, setSelectedMode] = useState('ALL')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (selectedMode !== 'ALL') params.set('mode', selectedMode)
      const res = await fetch('/api/admin/finance/profit-loss?' + params.toString())
      const json = await res.json()
      if (json.success && json.data) {
        setPl(json.data)
      }
    } catch (err) {
      console.error('Error fetching P&L:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(val || 0)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <Link href="/admin/finance/overview" className="hover:text-blue-600">Finance</Link>
            <ChevronRight size={12} />
            <span className="text-gray-700">Profit & Loss</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
            Profit & Loss Statement (P&L)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Statement of financial performance: Gross revenue, COGS, operating margins, and net income.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-xl gap-1.5 text-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Recalculate
          </Button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <Card className="rounded-2xl border-gray-200/80 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-gray-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-gray-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Channel:</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white"
            >
              <option value="ALL">All Channels</option>
              <option value="WHOLESALE">B2B Wholesale</option>
              <option value="RETAIL">B2C Retail</option>
            </select>
          </div>
          <Button size="sm" onClick={fetchData} className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white">
            Filter Period
          </Button>
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate('')
                setEndDate('')
                setTimeout(fetchData, 10)
              }}
              className="rounded-xl text-xs text-gray-500"
            >
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* P&L Statement Structure */}
      <Card className="rounded-3xl border-gray-200/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs">Computing profit & loss statement...</p>
          </div>
        ) : (
          <div className="p-6 divide-y divide-gray-100 space-y-6">
            {/* Revenue */}
            <div>
              <div className="flex items-center justify-between pb-3">
                <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">1. Operating Revenue</span>
                <span className="text-base font-black text-gray-900">{formatCurrency(pl?.revenue?.grossRevenue ?? 0)}</span>
              </div>
              <div className="pl-4 space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Product Sales Revenue</span>
                  <span className="font-medium text-gray-900">{formatCurrency(pl?.revenue?.totalSalesRevenue ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping & Freight Revenue</span>
                  <span className="font-medium text-gray-900">{formatCurrency(pl?.revenue?.totalShippingRevenue ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax & Customs Collected</span>
                  <span className="font-medium text-gray-900">{formatCurrency(pl?.revenue?.totalTaxCollected ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div className="pt-6">
              <div className="flex items-center justify-between pb-3">
                <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">2. Cost of Goods Sold (COGS)</span>
                <span className="text-base font-black text-rose-700">({formatCurrency(pl?.costOfGoodsSold?.totalCogs ?? 0)})</span>
              </div>
              <div className="pl-4 space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Supplier Purchase Cost & Direct Fulfillment</span>
                  <span className="font-medium text-rose-700">{formatCurrency(pl?.costOfGoodsSold?.totalCogs ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Gross Profit Callout */}
            <div className="pt-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Gross Profit</span>
                  <span className="text-xs text-gray-400">Gross Margin: {pl?.costOfGoodsSold?.grossMarginPercent ?? 0}%</span>
                </div>
                <span className={"text-xl font-black " + ((pl?.costOfGoodsSold?.grossProfit ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                  {formatCurrency(pl?.costOfGoodsSold?.grossProfit ?? 0)}
                </span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="pt-6">
              <div className="flex items-center justify-between pb-3">
                <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">3. Operating Expenses</span>
                <span className="text-base font-black text-gray-700">({formatCurrency(pl?.operatingExpenses?.totalOperatingExpenses ?? 0)})</span>
              </div>
              <div className="pl-4 space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Platform, Processing & Overhead Expenses</span>
                  <span className="font-medium text-gray-700">{formatCurrency(pl?.operatingExpenses?.totalOperatingExpenses ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Net Income Summary */}
            <div className="pt-6">
              <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block">Net Income</span>
                  <span className="text-xs text-blue-700">Net Margin: {pl?.netIncome?.netMarginPercent ?? 0}%</span>
                </div>
                <span className={"text-2xl font-black " + ((pl?.netIncome?.netIncome ?? 0) >= 0 ? 'text-blue-900' : 'text-rose-700')}>
                  {formatCurrency(pl?.netIncome?.netIncome ?? 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
