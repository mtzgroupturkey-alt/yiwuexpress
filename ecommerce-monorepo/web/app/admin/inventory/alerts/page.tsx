'use client'

import React, { useState, useEffect } from 'react'
import {
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Warehouse as WarehouseIcon,
  ShieldAlert,
  ArrowRight,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext'

export default function LowStockAlertsPage() {
  const { dict } = useAdminLocale()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)
      const res = await fetch(`/api/admin/inventory/alerts?${params.toString()}`)
      const data = await res.json()
      if (data.success) setAlerts(data.data || [])
    } catch (err) {
      console.error('Failed to load alerts', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAlerts() }, [statusFilter, search])

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

  const handleResolve = async (id: string, newStatus: 'RESOLVED' | 'DISMISSED') => {
    try {
      setUpdatingId(id)
      const res = await fetch(`/api/admin/inventory/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) fetchAlerts()
      else setMessage({ type: 'error', text: data.error || 'Update failed' })
    } catch (err) {
      console.error('Failed to update alert', err)
    } finally {
      setUpdatingId(null)
    }
  }

  // For virtual alerts: run scan first to persist them, then dismiss
  const handleVirtualDismiss = async () => {
    try {
      setScanning(true)
      setMessage(null)
      const res = await fetch('/api/admin/inventory/alerts', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Alerts saved. You can now dismiss individual alerts.' })
        fetchAlerts()
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Scan error' })
    } finally {
      setScanning(false)
    }
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH':     return 'bg-amber-100 text-amber-800 border-amber-200'
      default:         return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':    return 'text-amber-600 bg-amber-50 border border-amber-200'
      case 'RESOLVED':  return 'text-emerald-700 bg-emerald-50 border border-emerald-200'
      case 'DISMISSED': return 'text-slate-500 bg-slate-100 border border-slate-200'
      default:          return 'text-gray-500'
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              {dict.inventoryAlerts.pageTitle}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
              {dict.inventoryAlerts.activeAlertsBadge.replace('{count}', String(alerts.length))}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{dict.inventoryAlerts.pageSubtitle}</p>
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
            {dict.inventoryAlerts.refresh}
          </Button>

          <Button
            size="sm"
            onClick={handleScan}
            disabled={scanning}
            className="rounded-xl gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
          >
            <ShieldAlert size={14} className={scanning ? 'animate-spin' : ''} />
            {scanning ? dict.inventoryAlerts.scanningStock : dict.inventoryAlerts.scanStockNow}
          </Button>
        </div>
      </div>

      {/* Message banner */}
      {message && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-bold ml-4">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder={dict.inventoryAlerts.searchPlaceholder}
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
            <option value="ACTIVE">{dict.inventoryAlerts.filterActive}</option>
            <option value="RESOLVED">{dict.inventoryAlerts.filterResolved}</option>
            <option value="DISMISSED">Dismissed</option>
            <option value="ALL">{dict.inventoryAlerts.filterAll}</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <Card className="rounded-2xl border-gray-200/80 overflow-hidden shadow-xs">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-amber-600 rounded-full animate-spin" />
              <span>{dict.inventoryAlerts.checkingThresholds}</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
              <p className="font-semibold text-gray-700">{dict.inventoryAlerts.allStockHealthy}</p>
              <p className="text-gray-400 mt-1">{dict.inventoryAlerts.noAlertsDesc}</p>
              <Button
                size="sm"
                onClick={handleScan}
                disabled={scanning}
                className="mt-4 rounded-xl gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                <ShieldAlert size={14} className={scanning ? 'animate-spin' : ''} />
                {scanning ? dict.inventoryAlerts.scanningStock : dict.inventoryAlerts.scanStockNow}
              </Button>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">{dict.inventoryAlerts.thSeverity}</th>
                  <th className="py-3 px-4">{dict.inventoryAlerts.thProductSku}</th>
                  <th className="py-3 px-4">{dict.inventoryAlerts.thWarehouse}</th>
                  <th className="py-3 px-4">{dict.inventoryAlerts.thCurrentStock}</th>
                  <th className="py-3 px-4">{dict.inventoryAlerts.thThreshold}</th>
                  <th className="py-3 px-4">{dict.common.status}</th>
                  <th className="py-3 px-4">{dict.inventoryAlerts.thTriggeredAt}</th>
                  <th className="py-3 px-4 text-right min-w-[200px]">{dict.inventoryAlerts.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alerts.map((al) => {
                  const sev = al.currentStock <= 0
                    ? 'CRITICAL'
                    : al.currentStock <= al.minStock / 2
                    ? 'HIGH'
                    : 'MEDIUM'
                  const isUpdating = updatingId === al.id

                  return (
                    <tr key={al.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Severity */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSeverityBadge(sev)}`}>
                          {sev}
                        </span>
                      </td>

                      {/* Product / SKU */}
                      <td className="py-3 px-4 font-medium text-gray-900">
                        <p className="font-semibold">{al.product?.name}</p>
                        <p className="text-[11px] font-mono text-gray-400">{al.product?.sku}</p>
                      </td>

                      {/* Warehouse */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-gray-700">
                          <WarehouseIcon size={13} className="text-gray-400 shrink-0" />
                          {al.warehouse?.code
                            ? <span className="font-medium">{al.warehouse.code}</span>
                            : <span className="text-gray-400 italic">Global</span>
                          }
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-4 font-bold font-mono text-red-600">
                        {al.currentStock} units
                      </td>

                      {/* Threshold */}
                      <td className="py-3 px-4 font-mono text-gray-600">
                        {al.minStock} units
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(al.status)}`}>
                          {al.status}
                        </span>
                      </td>

                      {/* Triggered At */}
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(al.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                          {al.status === 'ACTIVE' && !al.isVirtual && (
                            <>
                              {/* Resolve */}
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => handleResolve(al.id, 'RESOLVED')}
                                className="h-7 px-2.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                              >
                                <CheckCircle2 size={12} />
                                {dict.inventoryAlerts.btnResolve}
                              </Button>

                              {/* Ignore / Dismiss */}
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => handleResolve(al.id, 'DISMISSED')}
                                className="h-7 px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 gap-1"
                              >
                                <EyeOff size={12} />
                                Ignore
                              </Button>

                              {/* PO Reorder */}
                              <Link href="/admin/purchase-orders/new">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 text-xs font-semibold rounded-lg gap-1"
                                >
                                  Reorder <ArrowRight size={11} />
                                </Button>
                              </Link>
                            </>
                          )}

                          {/* Virtual alert — needs to be persisted before it can be dismissed */}
                          {al.isVirtual && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={scanning}
                                onClick={handleScan}
                                className="h-7 px-2.5 text-xs font-semibold rounded-lg text-amber-700 border-amber-200 hover:bg-amber-50 gap-1"
                              >
                                <ShieldAlert size={12} className={scanning ? 'animate-spin' : ''} />
                                {scanning ? 'Saving…' : 'Save Alert'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={scanning}
                                onClick={handleVirtualDismiss}
                                className="h-7 px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 gap-1"
                              >
                                <EyeOff size={12} />
                                Ignore
                              </Button>
                            </>
                          )}

                          {/* Already resolved/dismissed — show re-activate option */}
                          {(al.status === 'RESOLVED' || al.status === 'DISMISSED') && !al.isVirtual && (
                            <span className="text-[11px] text-gray-400 italic px-1">No actions</span>
                          )}
                        </div>
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
