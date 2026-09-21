'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Bell,
  Plus,
  Send,
  Calendar,
  Users,
  MousePointerClick,
  Smartphone,
  Laptop,
  Tablet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Loader2,
  Eye,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext'

interface PushStats {
  totalSubscribers: number
  activeSubscribers: number
  activePercent: number
  sentLast30Days: number
  totalSent: number
  totalClicked: number
  totalFailed: number
  avgCtr: number
  deviceBreakdown: Record<string, number>
  browserBreakdown: Record<string, number>
}

interface NotificationItem {
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
  _count?: {
    deliveries: number
  }
}

export default function AdminNotificationsPage() {
  const { t } = useAdminLocale()

  const [stats, setStats] = useState<PushStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  const [items, setItems] = useState<NotificationItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true)
      const res = await fetch('/api/admin/push/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to load push stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  // Fetch history list
  const fetchHistory = useCallback(async () => {
    try {
      setLoadingItems(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: statusFilter,
        search: searchQuery,
      })
      const res = await fetch(`/api/admin/push/history?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalCount(data.pagination?.total || 0)
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoadingItems(false)
    }
  }, [page, statusFilter, searchQuery])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Cancel scheduled
  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled notification?')) return
    try {
      setCancellingId(id)
      const res = await fetch(`/api/admin/push/${id}/cancel`, { method: 'POST' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Scheduled notification cancelled' })
        fetchHistory()
        fetchStats()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to cancel', variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setCancellingId(null)
    }
  }

  // Delete notification
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification record?')) return
    try {
      setDeletingId(id)
      const res = await fetch(`/api/admin/push/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Deleted', description: 'Notification record removed' })
        fetchHistory()
        fetchStats()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to delete', variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50">
            <CheckCircle2 className="w-3 h-3" /> Sent
          </span>
        )
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50">
            <Clock className="w-3 h-3" /> Scheduled
          </span>
        )
      case 'SENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/50 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" /> Sending
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400 border border-gray-200/50">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50">
            <AlertTriangle className="w-3 h-3" /> Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        )
    }
  }

  const getSegmentLabel = (segment: string) => {
    switch (segment) {
      case 'ALL':
        return 'All Subscribers'
      case 'ACTIVE_30D':
        return 'Active (30 Days)'
      case 'BUYERS':
        return 'Past Buyers'
      case 'INACTIVE':
        return 'Inactive Users'
      case 'SINGLE_USER':
        return 'Single User'
      default:
        return segment
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#00407a]/10 dark:bg-blue-500/15 flex items-center justify-center text-[#00407a] dark:text-blue-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Push Notifications
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Compose, target, preview, and broadcast real-time web push messages
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStats()
              fetchHistory()
            }}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingItems ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Link href="/admin/notifications/new">
            <Button className="bg-[#00407a] hover:bg-[#00305c] text-white flex items-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Compose Notification</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Subscribers */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Total Subscribers
            </CardTitle>
            <Users className="w-4 h-4 text-[#00407a] dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {loadingStats ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                stats?.totalSubscribers.toLocaleString() ?? '0'
              )}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <span>{stats?.activePercent ?? 0}% active subscribers</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Active Breakdown */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Active Devices
            </CardTitle>
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {loadingStats ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                stats?.activeSubscribers.toLocaleString() ?? '0'
              )}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-2 mt-1">
              <span className="flex items-center gap-0.5">
                <Laptop className="w-3 h-3" /> {stats?.deviceBreakdown?.desktop ?? 0}
              </span>
              <span className="flex items-center gap-0.5">
                <Smartphone className="w-3 h-3" /> {stats?.deviceBreakdown?.mobile ?? 0}
              </span>
              <span className="flex items-center gap-0.5">
                <Tablet className="w-3 h-3" /> {stats?.deviceBreakdown?.tablet ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Sent (Last 30 Days) */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Sent (Last 30d)
            </CardTitle>
            <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {loadingStats ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                stats?.sentLast30Days.toLocaleString() ?? '0'
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {stats?.totalSent.toLocaleString() ?? 0} total deliveries
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Avg CTR */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Avg Click-Through (CTR)
            </CardTitle>
            <MousePointerClick className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {loadingStats ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                `${stats?.avgCtr ?? 0}%`
              )}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
              {stats?.totalClicked.toLocaleString() ?? 0} total clicks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* History & Campaign List */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
                Notification History
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 dark:text-slate-400">
                Track delivery, target segments, clicks, and status of recent campaigns
              </CardDescription>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search title or body..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00407a]"
              >
                <option value="ALL">All Statuses</option>
                <option value="SENT">Sent</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="SENDING">Sending</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loadingItems ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#00407a]" />
              <p className="text-xs">Loading notifications history...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Bell className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                No notifications found
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No notifications match the active filter criteria.'
                  : 'You have not sent or scheduled any push notifications yet.'}
              </p>
              <Link href="/admin/notifications/new">
                <Button size="sm" className="bg-[#00407a] hover:bg-[#00305c] text-white text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Compose First Notification
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-gray-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4">Audience</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Delivery</th>
                    <th className="py-3 px-4">Open Rate</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item) => {
                    const ctr =
                      item.totalSent > 0
                        ? ((item.totalClicked / item.totalSent) * 100).toFixed(1)
                        : '0.0'

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex items-start gap-2.5">
                            {item.iconUrl ? (
                              <img
                                src={item.iconUrl}
                                alt="icon"
                                className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#00407a] dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Bell className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-gray-900 dark:text-white truncate">
                                {item.title}
                              </h4>
                              <p className="text-gray-500 dark:text-slate-400 line-clamp-1 text-[11px] mt-0.5">
                                {item.body}
                              </p>
                              {item.actionUrl && item.actionUrl !== '/' && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  {item.actionUrl}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-medium text-gray-700 dark:text-slate-300">
                            {getSegmentLabel(item.segment)}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {item.totalSent} <span className="text-gray-400 font-normal">/ {item.totalTargets}</span>
                          </div>
                          {item.totalFailed > 0 && (
                            <span className="text-[10px] text-rose-500">
                              {item.totalFailed} failed
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {ctr}%
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {item.totalClicked} clicks
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-gray-500 dark:text-slate-400">
                          <div>
                            {item.status === 'SCHEDULED' && item.scheduledFor
                              ? `For ${new Date(item.scheduledFor).toLocaleDateString()} ${new Date(item.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : item.sentAt
                              ? new Date(item.sentAt).toLocaleDateString() + ' ' + new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : new Date(item.createdAt).toLocaleDateString()}
                          </div>
                          {item.createdBy && (
                            <span className="text-[10px] text-gray-400 block">
                              by {item.createdBy}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/admin/notifications/${item.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
                                title="View details and analytics"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                              </Button>
                            </Link>

                            {item.status === 'SCHEDULED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={cancellingId === item.id}
                                onClick={() => handleCancel(item.id)}
                                className="h-7 px-2 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-200"
                              >
                                {cancellingId === item.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Cancel'
                                )}
                              </Button>
                            )}

                            {item.status !== 'SENDING' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deletingId === item.id}
                                onClick={() => handleDelete(item.id)}
                                className="h-7 w-7 p-0 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Delete record"
                              >
                                {deletingId === item.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
              <div>
                Showing page {page} of {totalPages} ({totalCount} total notifications)
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-2"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
