'use client'

import React, { useState, useEffect } from 'react'
import { Download, RefreshCw, FileText, BarChart3, Warehouse, DollarSign, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext'

export default function ReportsInventoryPage() {
  const { dict } = useAdminLocale()
  const [data, setData] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/reports/inventory')
      const json = await res.json()
      if (json.success) {
        setData(json.data || [])
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            {dict.reports.inventoryTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {dict.reports.inventorySubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchReport} className="rounded-xl gap-1.5 text-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {dict.reports.refresh}
          </Button>
          <a href="/api/admin/reports/inventory?format=csv" download="inventory-valuation.csv">
            <Button size="sm" className="rounded-xl gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
              <Download size={14} />
              {dict.reports.exportCsv}
            </Button>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-gray-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{dict.reports.totalValuation}</p>
                <p className="text-xl font-black text-gray-900 font-mono">${Number(summary.totalValuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Layers size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{dict.reports.totalPhysicalUnits}</p>
                <p className="text-xl font-black text-gray-900 font-mono">{summary.totalUnits}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Warehouse size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{dict.reports.activeSkus}</p>
                <p className="text-xl font-black text-gray-900 font-mono">{summary.recordCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Sub-Tabs for Reports */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 text-xs font-semibold">
        <span className="px-3 py-1.5 bg-[#1a3a5c] text-white rounded-lg">{dict.reports.tabInventoryValuation}</span>
        <Link href="/admin/reports/landed-cost" className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">{dict.reports.tabLandedCost}</Link>
        <Link href="/admin/reports/sales" className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">{dict.reports.tabSalesMargins}</Link>
        <Link href="/admin/reports/stock-movements" className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">{dict.reports.tabStockLedger}</Link>
      </div>

      {/* Report Table */}
      <Card className="rounded-2xl border-gray-200/80 overflow-hidden shadow-xs">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">{dict.reports.thWarehouse}</th>
                <th className="py-3 px-4">{dict.reports.thProductName}</th>
                <th className="py-3 px-4">{dict.reports.thSku}</th>
                <th className="py-3 px-4">{dict.reports.thLocation}</th>
                <th className="py-3 px-4 text-right">{dict.reports.thOnHand}</th>
                <th className="py-3 px-4 text-right">{dict.reports.thReserved}</th>
                <th className="py-3 px-4 text-right">{dict.reports.thAvailable}</th>
                <th className="py-3 px-4 text-right">{dict.reports.thAvgLandedCost}</th>
                <th className="py-3 px-4 text-right">{dict.reports.thAssetValuation}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/60">
                  <td className="py-3 px-4 font-bold text-gray-900">{r.warehouseCode} ({r.country})</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{r.productName}</td>
                  <td className="py-3 px-4 font-mono text-gray-500">{r.sku}</td>
                  <td className="py-3 px-4 font-mono text-gray-600">{r.locationCode}</td>
                  <td className="py-3 px-4 text-right font-bold">{r.quantity}</td>
                  <td className="py-3 px-4 text-right text-amber-600 font-medium">{r.reservedQty}</td>
                  <td className="py-3 px-4 text-right text-emerald-600 font-bold">{r.availableQty}</td>
                  <td className="py-3 px-4 text-right font-mono">${Number(r.avgCost).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">${Number(r.totalValue).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
