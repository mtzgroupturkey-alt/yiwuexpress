'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Users, UserCheck, ShieldAlert, Award, Search, RefreshCw,
  ChevronRight, Download, Mail, Phone, ExternalLink, Check, CheckCircle2, Loader2,
  Trash2, AlertTriangle, X, UserX, RotateCcw, Building2, User
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminLocale } from '../contexts/AdminLocaleContext'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface CustomerItem {
  id: string
  name: string
  email: string
  companyName: string | null
  businessType: string | null
  country: string | null
  phone: string | null
  isActive?: boolean
  joinedAt: string
  userType?: string
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DOCUMENTS_REQUIRED'
  orderCount: number
  ltv: number
  lastOrderDate: string | null
  daysSinceLastOrder: number | null
  segment: 'VIP' | 'B2B' | 'NEW' | 'AT_RISK' | 'REGULAR'
}

interface CustomerSummary {
  totalCustomers: number
  activeCount?: number
  inactiveCount?: number
  totalLtv: number
  avgLtv: number
  vipCount: number
  b2bCount: number
  b2cCount?: number
  atRiskCount: number
}

export default function CustomersPage() {
  const { dict, locale } = useAdminLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlType = searchParams?.get('type') // 'b2b' | 'b2c' | null

  // Determine active customer type filter
  const activeType = (urlType?.toLowerCase() === 'b2b' ? 'b2b' : urlType?.toLowerCase() === 'b2c' ? 'b2c' : 'all') as 'all' | 'b2b' | 'b2c'

  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [reactivatingId, setReactivatingId] = useState<string | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<CustomerItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [summary, setSummary] = useState<CustomerSummary | null>(null)
  const [search, setSearch] = useState('')
  const [selectedSegment, setSelectedSegment] = useState<'ALL' | 'VIP' | 'B2B' | 'NEW' | 'AT_RISK'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedSegment !== 'ALL') params.set('segment', selectedSegment)
      if (activeType !== 'all') params.set('type', activeType)
      params.set('status', statusFilter)
      const res = await fetch('/api/admin/customers?' + params.toString())
      const json = await res.json()
      if (json.success && json.data) {
        setCustomers(json.data.customers)
        setSummary(json.data.summary)
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (customerId: string) => {
    setApprovingId(customerId)
    try {
      const res = await fetch(`/api/admin/users/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          verificationStatus: 'APPROVED',
          userType: 'WHOLESALE',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customerId
              ? { ...c, verificationStatus: 'APPROVED', userType: 'WHOLESALE' }
              : c
          )
        )
      } else {
        alert(data.error || 'Failed to approve customer')
      }
    } catch (err: any) {
      alert('Error approving customer')
    } finally {
      setApprovingId(null)
    }
  }

  const handleReactivate = async (customer: CustomerItem) => {
    setReactivatingId(customer.id)
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: customer.id,
          isActive: true,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(json.message || 'Customer account reactivated successfully')
        if (statusFilter === 'inactive') {
          setCustomers((prev) => prev.filter((c) => c.id !== customer.id))
        } else {
          setCustomers((prev) =>
            prev.map((c) => (c.id === customer.id ? { ...c, isActive: true } : c))
          )
        }
        setSummary((prev) => {
          if (!prev) return null
          return {
            ...prev,
            activeCount: (prev.activeCount ?? 0) + 1,
            inactiveCount: Math.max(0, (prev.inactiveCount ?? 1) - 1),
          }
        })
      } else {
        toast.error(json.error || 'Failed to reactivate customer')
      }
    } catch (err: any) {
      console.error('Error reactivating customer:', err)
      toast.error(err.message || 'Error reactivating customer')
    } finally {
      setReactivatingId(null)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/customers?id=${customerToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const json = await res.json()
      if (res.ok && json.success) {
        if (json.action === 'deactivated') {
          toast.success('Customer account deactivated (view under "Deactivated" tab)')
          if (statusFilter === 'active') {
            setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id))
          } else {
            setCustomers((prev) =>
              prev.map((c) => (c.id === customerToDelete.id ? { ...c, isActive: false } : c))
            )
          }
          setSummary((prev) => {
            if (!prev) return null
            return {
              ...prev,
              activeCount: Math.max(0, (prev.activeCount ?? prev.totalCustomers) - 1),
              inactiveCount: (prev.inactiveCount ?? 0) + 1,
            }
          })
        } else {
          toast.success(json.message || 'Customer permanently deleted')
          setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id))
          setSummary((prev) => {
            if (!prev) return null
            const newTotal = Math.max(0, prev.totalCustomers - 1)
            const newTotalLtv = Math.max(0, prev.totalLtv - customerToDelete.ltv)
            return {
              ...prev,
              totalCustomers: newTotal,
              activeCount: Math.max(0, (prev.activeCount ?? prev.totalCustomers) - 1),
              totalLtv: newTotalLtv,
              avgLtv: newTotal > 0 ? newTotalLtv / newTotal : 0,
              vipCount: customerToDelete.segment === 'VIP' ? Math.max(0, prev.vipCount - 1) : prev.vipCount,
              b2bCount: customerToDelete.segment === 'B2B' ? Math.max(0, prev.b2bCount - 1) : prev.b2bCount,
              atRiskCount: customerToDelete.segment === 'AT_RISK' ? Math.max(0, prev.atRiskCount - 1) : prev.atRiskCount,
            }
          })
        }
        setCustomerToDelete(null)
      } else {
        toast.error(json.error || 'Failed to remove customer')
      }
    } catch (err: any) {
      console.error('Error removing customer:', err)
      toast.error(err.message || 'Error removing customer')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedSegment, statusFilter, activeType])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0)
  }

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Company', 'Country', 'Status', 'Segment', 'Orders', 'LTV ($)', 'Joined Date']
    const rows = customers.map((c) => [
      c.name,
      c.email,
      c.companyName || '',
      c.country || '',
      c.isActive === false ? 'Deactivated' : 'Active',
      c.segment,
      c.orderCount,
      c.ltv,
      new Date(c.joinedAt).toLocaleDateString(),
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'customers_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Customer Management Hub
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor customer Lifetime Value (LTV), buying frequency, and segmentation (VIP, B2B wholesale, at-risk).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-xl gap-1.5 text-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button size="sm" onClick={exportCsv} className="rounded-xl text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <Download size={14} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className={"rounded-2xl cursor-pointer transition-all " + (selectedSegment === 'ALL' ? 'ring-2 ring-blue-500 bg-blue-50/20' : '')} onClick={() => setSelectedSegment('ALL')}>
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Customers</span>
            <div className="text-xl font-black text-gray-900 mt-1">{summary?.totalCustomers || 0}</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-gray-400">Avg LTV: {formatCurrency(summary?.avgLtv || 0)}</CardContent>
        </Card>

        <Card className={"rounded-2xl cursor-pointer transition-all " + (selectedSegment === 'VIP' ? 'ring-2 ring-purple-500 bg-purple-50/20' : '')} onClick={() => setSelectedSegment('VIP')}>
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">VIP Clients</span>
            <div className="text-xl font-black text-purple-700 mt-1">{summary?.vipCount || 0}</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-purple-600/70">LTV &gt; $10k or 10+ orders</CardContent>
        </Card>

        <Card className={"rounded-2xl cursor-pointer transition-all " + (selectedSegment === 'B2B' ? 'ring-2 ring-blue-500 bg-blue-50/20' : '')} onClick={() => setSelectedSegment('B2B')}>
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">B2B Wholesale</span>
            <div className="text-xl font-black text-blue-700 mt-1">{summary?.b2bCount || 0}</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-blue-600/70">Registered business accounts</CardContent>
        </Card>

        <Card className={"rounded-2xl cursor-pointer transition-all " + (selectedSegment === 'AT_RISK' ? 'ring-2 ring-rose-500 bg-rose-50/20' : '')} onClick={() => setSelectedSegment('AT_RISK')}>
          <CardHeader className="pb-1 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">At-Risk Clients</span>
            <div className="text-xl font-black text-rose-700 mt-1">{summary?.atRiskCount || 0}</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-rose-600/70">&gt; 90 days since order</CardContent>
        </Card>
      </div>

      {/* Customer Type Tabs (All / B2B Wholesale / B2C Retail) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedSegment('ALL')
              router.push('/admin/customers')
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
              activeType === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80'
            }`}
          >
            <Users size={15} />
            <span>All Customers</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeType === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {summary?.totalCustomers || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedSegment('ALL')
              router.push('/admin/customers?type=b2b')
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
              activeType === 'b2b'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80'
            }`}
          >
            <Building2 size={15} />
            <span>B2B Wholesale</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeType === 'b2b' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
              }`}
            >
              {summary?.b2bCount || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedSegment('ALL')
              router.push('/admin/customers?type=b2c')
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
              activeType === 'b2c'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80'
            }`}
          >
            <User size={15} />
            <span>B2C Retail</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeType === 'b2c' ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-700'
              }`}
            >
              {summary?.b2cCount || 0}
            </span>
          </button>
        </div>

        {activeType !== 'all' && (
          <div className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/60">
            Filtered by: <span className="font-bold text-gray-900 uppercase">{activeType} Customers</span>
          </div>
        )}
      </div>

      {/* Status Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl border border-gray-200/60 w-fit">
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-white text-gray-900 shadow-2xs font-bold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <UserCheck size={13} className={statusFilter === 'active' ? 'text-emerald-600' : 'text-gray-400'} />
            Active
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                statusFilter === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-gray-200/70 text-gray-600'
              }`}
            >
              {summary?.activeCount ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-white text-amber-900 shadow-2xs font-bold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <UserX size={13} className={statusFilter === 'inactive' ? 'text-amber-600' : 'text-gray-400'} />
            Deactivated
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                statusFilter === 'inactive'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300/80'
                  : 'bg-gray-200/70 text-gray-600'
              }`}
            >
              {summary?.inactiveCount ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-gray-900 shadow-2xs font-bold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Users size={13} className={statusFilter === 'all' ? 'text-blue-600' : 'text-gray-400'} />
            All Accounts
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                statusFilter === 'all'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'bg-gray-200/70 text-gray-600'
              }`}
            >
              {(summary?.activeCount ?? 0) + (summary?.inactiveCount ?? 0)}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Deactivated Notice Banner */}
      {statusFilter === 'inactive' && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 animate-in fade-in duration-150">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-900">Viewing Deactivated Customer Accounts</div>
            <p className="text-amber-800/90 leading-relaxed">
              These customers are currently deactivated and cannot log in or submit new orders. All previous transaction records, invoices, orders, and addresses remain intact for accounting and tax compliance. You can restore access at any time with the <strong>Reactivate</strong> button.
            </p>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <Card className="rounded-2xl border-gray-200/80 overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {customers.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              {statusFilter === 'inactive'
                ? 'No deactivated customer accounts found.'
                : 'No customer accounts match your search.'}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type & Structure</th>
                  <th className="py-3 px-4">Segment</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Lifetime Value</th>
                  <th className="py-3 px-4 text-center">Last Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className={
                      c.isActive === false
                        ? 'bg-amber-50/30 hover:bg-amber-50/60 transition-colors'
                        : 'hover:bg-gray-50/50 transition-colors'
                    }
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="font-bold text-gray-900">{c.name}</div>
                        {c.isActive === false && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200/80">
                            <UserX size={10} className="text-amber-700" />
                            Deactivated
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400">{c.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.userType === 'WHOLESALE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Wholesale (B2B)
                          </span>
                        ) : c.userType === 'BOTH' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Hybrid (Both)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Retail (B2C)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-medium text-gray-700 mt-0.5">
                        {c.companyName || (c.userType === 'WHOLESALE' ? 'Individual Wholesaler' : 'Individual Consumer')}
                      </div>
                      {(c.businessType || c.country) && (
                        <div className="text-[10px] text-gray-400">
                          {[c.businessType, c.country].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold " + (
                        c.segment === 'VIP'
                          ? 'bg-purple-50 text-purple-700'
                          : c.segment === 'B2B'
                          ? 'bg-blue-50 text-blue-700'
                          : c.segment === 'AT_RISK'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-gray-100 text-gray-700'
                      )}>
                        {c.segment}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-800">{c.orderCount}</td>
                    <td className="py-3 px-4 text-right font-black text-gray-900">{formatCurrency(c.ltv)}</td>
                    <td className="py-3 px-4 text-center text-gray-500">
                      {c.daysSinceLastOrder !== null ? `${c.daysSinceLastOrder}d ago` : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.isActive === false ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={reactivatingId === c.id}
                              onClick={() => handleReactivate(c)}
                              className="rounded-xl text-[11px] h-7 px-2.5 gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold shadow-2xs cursor-pointer active:scale-95 transition-all"
                              title="Reactivate customer account access"
                            >
                              {reactivatingId === c.id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <RotateCcw size={11} className="stroke-[2.5]" />
                              )}
                              Reactivate
                            </Button>
                            <Link href={'/admin/users/' + c.id}>
                              <Button size="sm" variant="ghost" className="rounded-xl text-[11px] h-7 px-2 gap-1 text-slate-600 hover:text-slate-900">
                                Profile
                                <ExternalLink size={12} />
                              </Button>
                            </Link>
                            {c.orderCount === 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setCustomerToDelete(c)}
                                className="rounded-xl text-[11px] h-7 px-2 gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                title="Permanently delete account (0 orders)"
                              >
                                <Trash2 size={12} />
                                Delete
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            {c.verificationStatus === 'APPROVED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <CheckCircle2 size={11} className="text-emerald-600" />
                                Approved
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                disabled={approvingId === c.id}
                                onClick={() => handleApprove(c.id)}
                                className="rounded-xl text-[11px] h-7 px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs cursor-pointer active:scale-95 transition-all"
                                title="Instantly approve B2B wholesale access"
                              >
                                {approvingId === c.id ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : (
                                  <Check size={11} className="stroke-[2.5]" />
                                )}
                                Approve
                              </Button>
                            )}
                            <Link href={'/admin/users/' + c.id}>
                              <Button size="sm" variant="ghost" className="rounded-xl text-[11px] h-7 px-2 gap-1 text-slate-600 hover:text-slate-900">
                                Profile
                                <ExternalLink size={12} />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCustomerToDelete(c)}
                              className="rounded-xl text-[11px] h-7 px-2 gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              title={c.orderCount > 0 ? "Deactivate account" : "Delete account"}
                            >
                              <Trash2 size={12} />
                              Remove
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Remove Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="p-5 pb-4 flex items-start justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {customerToDelete.orderCount > 0 ? 'Deactivate Customer' : 'Delete Customer'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {customerToDelete.orderCount > 0
                      ? 'Preserve financial history & revoke access'
                      : 'Permanently remove customer account'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !deleting && setCustomerToDelete(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 transition-colors"
                disabled={deleting}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Customer Profile Card */}
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{customerToDelete.name}</div>
                    <div className="text-xs text-gray-500">{customerToDelete.email}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-gray-200 text-gray-700">
                    {customerToDelete.segment}
                  </span>
                </div>
                {customerToDelete.companyName && (
                  <div className="text-xs text-gray-600 pt-1 border-t border-gray-200/60">
                    Company: <span className="font-medium text-gray-900">{customerToDelete.companyName}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-600 pt-1 border-t border-gray-200/60">
                  <div>
                    Orders: <span className="font-bold text-gray-900">{customerToDelete.orderCount}</span>
                  </div>
                  <div>
                    Lifetime Value: <span className="font-bold text-gray-900">{formatCurrency(customerToDelete.ltv)}</span>
                  </div>
                </div>
              </div>

              {/* Consequence Explanation */}
              {customerToDelete.orderCount > 0 ? (
                <div className="bg-amber-50/80 rounded-xl p-3.5 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <span>Notice: Audit &amp; Financial Compliance</span>
                  </div>
                  <p className="leading-relaxed">
                    This customer has placed <strong>{customerToDelete.orderCount} order(s)</strong> with total value of <strong>{formatCurrency(customerToDelete.ltv)}</strong>.
                  </p>
                  <p className="leading-relaxed text-amber-800/90">
                    Their account will be <strong>deactivated</strong>. Invoices, tax records, and order history will remain preserved, while account access and future order placement will be disabled.
                  </p>
                </div>
              ) : (
                <div className="bg-rose-50/80 rounded-xl p-3.5 border border-rose-200 text-xs text-rose-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-rose-800">
                    <span>Warning: Irreversible Deletion</span>
                  </div>
                  <p className="leading-relaxed">
                    This customer has <strong>0 orders</strong>. All account details, addresses, and inquiry records will be <strong>permanently deleted</strong> from the database.
                  </p>
                  <p className="leading-relaxed text-rose-800/90">
                    This action cannot be undone.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomerToDelete(null)}
                disabled={deleting}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteCustomer}
                disabled={deleting}
                className={
                  "rounded-xl text-xs gap-1.5 text-white font-bold shadow-sm " +
                  (customerToDelete.orderCount > 0
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700')
                }
              >
                {deleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Processing...
                  </>
                ) : customerToDelete.orderCount > 0 ? (
                  <>
                    <AlertTriangle size={13} />
                    Deactivate Account
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    Delete Permanently
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
