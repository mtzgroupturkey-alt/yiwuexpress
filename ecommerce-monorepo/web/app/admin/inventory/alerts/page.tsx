'use client'

import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Warehouse as WarehouseIcon,
  Package,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function LowStockAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)

      const res = await fetch(`/api/admin/inventory/alerts?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setAlerts(data.data || [])
      }
    } catch (err) {
      console.error('Failed to load alerts', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [statusFilter, search])

  const handleScan = async () => {
    try {
      setScanning(true)
      setMessage(null)
      const res = await fetch('/api/admin/inventory/alerts', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        fetchAlerts()
      } else {
        setMessage({ type: 'error', text: data.error || 'Scan failed' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Scan error' })
    } finally {
      setScanning(false)
    }
  }

  const handleResolve = async (id: string, newStatus: 'RESOLVED' | 'IGNORED') => {
    try {
      const res = await fetch(`/api/admin/inventory/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        fetchAlerts()
      }
    } catch (err) {
      console.error('Failed to update alert', err)
    }
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Low Stock Alerts & Reorder Points
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
              {alerts.length} alerts
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Automated notifications for multi-warehouse balance deficiencies and threshold triggers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            disabled={loading}
            className="rounded-xl gap-1.5 text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleScan}
            disabled={scanning}
            className="rounded-xl gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
          >
            <ShieldAlert size={14} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning Warehouse Stock...' : 'Scan Stock Now'}
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-gray-50/50 border-gray-200 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 bg-gray-50 border border-gray-200 text-xs font-medium rounded-xl text-gray-700 outline-hidden"
          >
            <option value="ACTIVE">Active Alerts</option>
            <option value="RESOLVED">Resolved Alerts</option>
            <option value="IGNORED">Ignored Alerts</option>
            <option value="ALL">All Alerts</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <Card className="rounded-2xl border-gray-200/80 overflow-hidden shadow-xs">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-amber-600 rounded-full animate-spin"></div>
              <span>Checking inventory thresholds...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
              <p className="font-semibold text-gray-700">All Stock Levels Healthy!</p>
              <p className="text-gray-400 mt-1">No low stock alerts matching current filter.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Product / SKU</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date Triggered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alerts.map((al) => (
                  <tr key={al.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4">
                      {(() => {
                        const sev = al.currentStock <= 0 ? 'CRITICAL' : al.currentStock <= (al.minStock / 2) ? 'HIGH' : 'MEDIUM'
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSeverityBadge(sev)}`}>
                            {sev}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      <div>
                        <p className="font-semibold">{al.product?.name}</p>
                        <p className="text-[11px] font-mono text-gray-400">{al.product?.sku}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-medium text-gray-700">
                        <WarehouseIcon size={13} className="text-gray-400" />
                        <span>{al.warehouse?.code}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold font-mono text-red-600">
                      {al.currentStock} units
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">
                      {al.minStock} units
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-semibold ${al.status === 'ACTIVE' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {al.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(al.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {al.status === 'ACTIVE' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolve(al.id, 'RESOLVED')}
                            className="h-7 px-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            Mark Resolved
                          </Button>
                          <Link href="/admin/purchase-orders/new">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs font-semibold rounded-lg"
                            >
                              PO Reorder <ArrowRight size={11} className="ml-1" />
                            </Button>
                          </Link>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
