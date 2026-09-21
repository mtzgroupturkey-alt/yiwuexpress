'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  MousePointerClick,
  Send,
  Users,
  ExternalLink,
  Laptop,
  Smartphone,
  Tablet,
  RefreshCw,
  Copy,
  Trash2,
  Loader2,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'

interface DeliveryItem {
  id: string
  status: string
  errorMessage: string | null
  sentAt: string | null
  clickedAt: string | null
  createdAt: string
  subscription: {
    id: string
    deviceType: string | null
    os: string | null
    browser: string | null
    country: string | null
    language: string | null
    lastSeenAt: string
    user: {
      id: string
      name: string
      email: string
    } | null
  }
}

interface NotificationDetail {
  id: string
  title: string
  body: string
  iconUrl: string | null
  imageUrl: string | null
  actionUrl: string | null
  actionLabel: string | null
  segment: string
  status: string
  scheduledFor: string | null
  sentAt: string | null
  totalTargets: number
  totalSent: number
  totalFailed: number
  totalClicked: number
  createdBy: string | null
  createdAt: string
  deliveries: DeliveryItem[]
}

export default function NotificationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [data, setData] = useState<NotificationDetail | null>(null)
  const [breakdown, setBreakdown] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/push/${id}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.notification)
        setBreakdown(json.breakdown || {})
      } else {
        toast({ title: 'Error', description: 'Failed to load notification details', variant: 'destructive' })
      }
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) fetchDetail()
  }, [id, fetchDetail])

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-gray-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-[#00407a]" />
        <p className="text-xs">Loading campaign analytics...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Notification not found
        </h3>
        <Link href="/admin/notifications">
          <Button variant="outline" size="sm" className="mt-4 text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Notifications
          </Button>
        </Link>
      </div>
    )
  }

  const ctr =
    data.totalSent > 0
      ? ((data.totalClicked / data.totalSent) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/notifications">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {data.title}
              </h1>
              <Badge
                variant={
                  data.status === 'SENT'
                    ? 'default'
                    : data.status === 'SCHEDULED'
                    ? 'secondary'
                    : 'destructive'
                }
                className="text-[10px] font-bold uppercase"
              >
                {data.status}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Audience: <strong className="text-gray-700 dark:text-slate-200">{data.segment}</strong> • Created on{' '}
              {new Date(data.createdAt).toLocaleDateString()} by {data.createdBy || 'Admin'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDetail}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>

          <Link href="/admin/notifications/new">
            <Button className="bg-[#00407a] hover:bg-[#00305c] text-white flex items-center gap-1 text-xs font-bold">
              <Copy className="w-3.5 h-3.5" /> Duplicate Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase">
              Target Audience
            </CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {data.totalTargets.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total matching devices</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase">
              Delivered
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {data.totalSent.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data.totalTargets > 0
                ? `${Math.round((data.totalSent / data.totalTargets) * 100)}% delivery rate`
                : '100%'}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase">
              Failed
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {data.totalFailed.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Expired or invalid endpoints</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase">
              Clicks & Open Rate
            </CardTitle>
            <MousePointerClick className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {ctr}%
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
              {data.totalClicked.toLocaleString()} verified clicks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Message Preview Card */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-gray-900 dark:text-white">
            Campaign Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-4">
            {data.iconUrl ? (
              <img
                src={data.iconUrl}
                alt="Icon"
                className="w-12 h-12 rounded-xl object-contain bg-white shrink-0 border border-slate-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-[#00407a] shrink-0">
                <Bell className="w-6 h-6" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {data.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 leading-relaxed">
                {data.body}
              </p>

              {data.imageUrl && (
                <div className="mt-3 max-w-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={data.imageUrl} alt="Banner" className="w-full h-36 object-cover" />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                {data.actionUrl && (
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Destination: {data.actionUrl}</span>
                  </div>
                )}
                {data.actionLabel && (
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 font-semibold text-gray-700 dark:text-slate-300 text-[11px]">
                    Button: {data.actionLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries Audit Table */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-bold text-gray-900 dark:text-white">
            Delivery Log ({data.deliveries?.length ?? 0} sample events)
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Per-subscriber delivery status, device environment, and interaction timestamp
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.deliveries?.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No individual delivery events recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-gray-500 border-b border-slate-100 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Recipient</th>
                    <th className="py-2.5 px-4">Device / OS</th>
                    <th className="py-2.5 px-4">Browser</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Sent At</th>
                    <th className="py-2.5 px-4">Clicked At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.deliveries.map((del) => (
                    <tr key={del.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {del.subscription?.user ? (
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {del.subscription.user.name}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {del.subscription.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Anonymous Guest</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap capitalize text-gray-700 dark:text-slate-300">
                        {del.subscription?.deviceType || 'desktop'} / {del.subscription?.os || 'unknown'}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap capitalize text-gray-700 dark:text-slate-300">
                        {del.subscription?.browser || 'unknown'}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {del.status === 'CLICKED' ? (
                          <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
                            <MousePointerClick className="w-3 h-3" /> Clicked
                          </span>
                        ) : del.status === 'SENT' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Sent
                          </span>
                        ) : del.status === 'FAILED' ? (
                          <span className="inline-flex items-center gap-1 text-rose-500 font-semibold" title={del.errorMessage || ''}>
                            <AlertTriangle className="w-3 h-3" /> Failed
                          </span>
                        ) : (
                          <span className="text-gray-400">{del.status}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap text-gray-500">
                        {del.sentAt ? new Date(del.sentAt).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap text-gray-500">
                        {del.clickedAt ? (
                          <span className="text-purple-600 font-semibold">
                            {new Date(del.clickedAt).toLocaleTimeString()}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
