'use client'

import React, { useState, useEffect } from 'react'
import { Download, RefreshCw, DollarSign, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext'

export default function ReportsSalesPage() {
  const { dict } = useAdminLocale()
  const [rows, setRows] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/reports/sales')
      const json = await res.json()
      if (json.success) {
        setRows(json.data || [])
        setSummary(json.summary)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            {dict.reports.salesTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {dict.reports.salesSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchReport} className="rounded-xl gap-1.5 text-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {dict.reports.refresh}
          </Button>
          <a href="/api/admin/reports/sales?format=csv" download="sales-profit-margin-report.csv">
            <Button size="sm" className="rounded-xl gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
              <Download size={14} />
              {dict.reports.exportCsv}
            </Button>
          </a>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-gray-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{dict.reports.totalRealizedRevenue}</p>
                <p className="text-xl font-black text-gray-900 font-mono">${Number(summary.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{dict.reports.totalLandedCogs}</p>
                <p className="text-xl font-black text-gray-900 font-mono">${Number(summary.totalCOGS || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{dict.reports.netGrossMargin}</p>
                <p className="text-xl font-black text-emerald-600 font-mono">${Number(summary.totalMargin || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200 pb-2 text-xs font-semibold">
        <Link href="/admin/reports/inventory" className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">{dict.reports.tabInventoryValuation}</Link>
        <Link href="/admin/reports/landed-cost" className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">{dict.reports.tabLandedCost}</Link>
        <span className="px-3 py-1.5 bg-[#1a3a5c] text-white rounded-lg">{dict.reports.tabSalesMargins}</span>
        <Link href="/admin/reports/stock-movements" className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">{dict.reports.tabStockLedger}</Link>
      </div>

      <Card className="rounded-2xl border-gray-200/80 overflow-hidden shadow-xs">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">{dict.reports.thOrderNum}</th>
                <th className="py-3 px-4">{dict.reports.thDate}</th>
                <th className="py-3 px-4">{dict.reports.thCustomer}</th>
                <th className="py-3 px-4">{dict.reports.thSalesChannel}</th>
                <th className="py-3 px-4 text-right">{dict.reports.thRevenue}</th>
                <th className="py-3 px-4 text-right">{dict.reports.thLandedCogs}</th>
                <th className="py-3 px-4 text-right">{dict.reports.thGrossMargin}</th>
                <th className="py-3 px-4 text-right">{dict.reports.thMarginPct}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, idx) => (
                <tr key={idx} className="hover:bg-gray-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{r.orderNumber}</td>
                  <td className="py-3 px-4 text-gray-400">{new Date(r.orderDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{r.customer}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">{r.salesType}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">${Number(r.revenue).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono text-gray-600">${Number(r.cogs).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">${Number(r.grossMargin).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{r.marginPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
