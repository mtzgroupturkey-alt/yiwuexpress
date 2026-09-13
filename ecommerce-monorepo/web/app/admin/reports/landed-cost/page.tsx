'use client'

import React, { useState, useEffect } from 'react'
import { Download, RefreshCw, Ship, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function ReportsLandedCostPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/reports/landed-cost')
      const json = await res.json()
      if (json.success) setRows(json.data || [])
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
            Container Landed Cost Allocation Report
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Breakdown of factory purchase prices vs allocated freight, customs, and landed unit costs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchReport} className="rounded-xl gap-1.5 text-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <a href="/api/admin/reports/landed-cost?format=csv" download="landed-cost-report.csv">
            <Button size="sm" className="rounded-xl gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
              <Download size={14} />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-2 text-xs font-semibold">
        <Link href="/admin/reports/inventory" className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">Inventory Valuation</Link>
        <span className="px-3 py-1.5 bg-[#1a3a5c] text-white rounded-lg">Landed Cost Multipliers</span>
        <Link href="/admin/reports/sales" className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">Sales & Profit Margins</Link>
        <Link href="/admin/reports/stock-movements" className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">Stock Movement Ledger</Link>
      </div>

      <Card className="rounded-2xl border-gray-200/80 overflow-hidden shadow-xs">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Container #</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Factory Cost</th>
                <th className="py-3 px-4 text-right">Allocated Freight</th>
                <th className="py-3 px-4 text-right">Landed Cost/Unit</th>
                <th className="py-3 px-4 text-right">Overhead (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, idx) => (
                <tr key={idx} className="hover:bg-gray-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{r.containerNumber}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">{r.status}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{r.productName}</td>
                  <td className="py-3 px-4 font-mono text-gray-400">{r.sku}</td>
                  <td className="py-3 px-4 text-right font-bold">{r.loadedQuantity}</td>
                  <td className="py-3 px-4 text-right font-mono">$${Number(r.factoryUnitCost).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono text-amber-600">+$${Number(r.allocatedFreightPerUnit).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">$${Number(r.landedUnitCost).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">+{r.costIncreasePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
