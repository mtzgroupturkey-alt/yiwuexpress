'use client'

import { useState, useEffect } from 'react'
import {
  Ship, Package, Clock, AlertTriangle, TrendingUp,
  RefreshCw, ChevronRight, ArrowUpRight, Anchor, MapPin
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'
import Link from 'next/link'

interface LogisticsKpis {
  avgTransitDays: number
  pendingDispatch: number
  inTransit: number
  customsHolds: number
  totalFreightRevenue: number
  totalCarrierCost: number
  freightProfit: number
  freightMarginRate: number
}

interface DelayedShipment {
  id: string
  trackingNumber: string
  carrier: string
  origin: string
  destination: string
  status: string
  estimatedDelivery: string | null
  daysOverdue: number
}

interface ActiveContainer {
  id: string
  containerNumber: string
  status: string
  vesselName: string | null
  route: string
  eta: string | null
  orderCount: number
}

export default function LogisticsOverviewPage() {
  const { dict, locale } = useAdminLocale()
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<LogisticsKpis | null>(null)
  const [delayedShipments, setDelayedShipments] = useState<DelayedShipment[]>([])
  const [activeContainers, setActiveContainers] = useState<ActiveContainer[]>([])

  const fetchLogistics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/logistics/overview')
      const json = await res.json()
      if (json.success && json.data) {
        setKpis(json.data.kpis)
        setDelayedShipments(json.data.delayedShipments)
        setActiveContainers(json.data.activeContainers)
      }
    } catch (err) {
      console.error('Error fetching logistics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogistics()
  }, [])

  const formatCurrency = (val: number | undefined) => {
    return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Cross-Border Logistics & Freight Command Center
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Unified maritime container tracking, customs clearances, transit KPIs, and freight profit margins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogistics} disabled={loading} className="rounded-xl gap-1.5 text-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Link href="/admin/shipments">
            <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5">
              <Ship size={14} />
              All Shipments
            </Button>
          </Link>
          <Link href="/admin/containers">
            <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5">
              <Package size={14} />
              Containers
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-gray-200/80">
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Avg Transit Time</span>
            <div className="text-2xl font-black text-gray-900 mt-1">{kpis?.avgTransitDays || 0} <span className="text-sm font-semibold text-gray-400">days</span></div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-gray-400">Origin dispatch to customer delivery</CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80">
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Dispatch</span>
            <div className="text-2xl font-black text-amber-700 mt-1">{kpis?.pendingDispatch || 0} <span className="text-sm font-semibold text-gray-400">orders</span></div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-amber-600/70">Awaiting carrier pickup / stuffing</CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80">
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Customs Holds</span>
            <div className="text-2xl font-black text-red-700 mt-1">{kpis?.customsHolds || 0}</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-red-600/70">Inspection & document exceptions</CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 bg-emerald-50/20">
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Freight Margin</span>
            <div className="text-2xl font-black text-emerald-800 mt-1">
              {formatCurrency(kpis?.freightProfit)} <span className="text-xs font-bold text-emerald-600">({kpis?.freightMarginRate || 0}%)</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-emerald-700/70">Customer billed vs carrier cost</CardContent>
        </Card>
      </div>

      {/* Delayed Shipments Alert Section */}
      {delayedShipments.length > 0 && (
        <Card className="rounded-2xl border-red-200 bg-red-50/30">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={18} />
              <CardTitle className="text-sm font-bold text-red-900">
                Delayed Shipments Alert ({delayedShipments.length})
              </CardTitle>
            </div>
            <span className="text-xs text-red-600 font-semibold">Exceeded Estimated Delivery Date</span>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse bg-white/70">
              <thead>
                <tr className="border-y border-red-100 text-gray-500 font-bold uppercase">
                  <th className="py-2.5 px-4">Tracking #</th>
                  <th className="py-2.5 px-4">Carrier</th>
                  <th className="py-2.5 px-4">Route</th>
                  <th className="py-2.5 px-4">Est. Delivery</th>
                  <th className="py-2.5 px-4 text-center">Overdue</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50">
                {delayedShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-red-50/50">
                    <td className="py-2.5 px-4 font-bold text-blue-600">
                      <Link href={'/admin/shipments/' + s.id}>{s.trackingNumber}</Link>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-gray-800">{s.carrier}</td>
                    <td className="py-2.5 px-4 text-gray-600">{s.origin} → {s.destination}</td>
                    <td className="py-2.5 px-4 text-gray-700">{s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString() : '-'}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                        {s.daysOverdue} days late
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link href={'/admin/shipments/' + s.id}>
                        <Button size="sm" variant="outline" className="rounded-xl text-[11px] h-7 px-2 border-red-200 text-red-700 hover:bg-red-50">
                          Update Tracking
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Active Containers Tracking */}
      <Card className="rounded-2xl border-gray-200/80">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Anchor className="text-blue-600" size={18} />
            <CardTitle className="text-sm font-bold text-gray-900">
              Active Maritime Containers
            </CardTitle>
          </div>
          <Link href="/admin/containers" className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
            All Containers <ArrowUpRight size={13} />
          </Link>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {activeContainers.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-xs">No active container voyages at this time.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase">
                  <th className="py-3 px-4">Container #</th>
                  <th className="py-3 px-4">Vessel</th>
                  <th className="py-3 px-4">Port Route</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Assigned Orders</th>
                  <th className="py-3 px-4 text-right">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeContainers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-bold text-gray-900">{c.containerNumber}</td>
                    <td className="py-3 px-4 text-gray-700 font-medium">{c.vesselName || 'Unassigned Vessel'}</td>
                    <td className="py-3 px-4 text-gray-600">{c.route}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-800">{c.orderCount}</td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {c.eta ? new Date(c.eta).toLocaleDateString() : 'TBD'}
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
