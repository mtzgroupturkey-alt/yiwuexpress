'use client'

import { useState, useEffect } from 'react'
import {
  Users, UserCheck, ShieldAlert, Award, Search, RefreshCw,
  ChevronRight, Download, Mail, Phone, ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminLocale } from '../contexts/AdminLocaleContext'
import Link from 'next/link'

interface CustomerItem {
  id: string
  name: string
  email: string
  companyName: string | null
  businessType: string | null
  country: string | null
  phone: string | null
  joinedAt: string
  orderCount: number
  ltv: number
  lastOrderDate: string | null
  daysSinceLastOrder: number | null
  segment: 'VIP' | 'B2B' | 'NEW' | 'AT_RISK' | 'REGULAR'
}

interface CustomerSummary {
  totalCustomers: number
  totalLtv: number
  avgLtv: number
  vipCount: number
  b2bCount: number
  atRiskCount: number
}

export default function CustomersPage() {
  const { dict, locale } = useAdminLocale()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [summary, setSummary] = useState<CustomerSummary | null>(null)
  const [search, setSearch] = useState('')
  const [selectedSegment, setSelectedSegment] = useState<'ALL' | 'VIP' | 'B2B' | 'NEW' | 'AT_RISK'>('ALL')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedSegment !== 'ALL') params.set('segment', selectedSegment)
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

  useEffect(() => {
    fetchData()
  }, [selectedSegment])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0)
  }

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Company', 'Country', 'Segment', 'Orders', 'LTV ($)', 'Joined Date']
    const rows = customers.map((c) => [
      c.name,
      c.email,
      c.companyName || '',
      c.country || '',
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

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
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

      {/* Customers Table */}
      <Card className="rounded-2xl border-gray-200/80 overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {customers.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">No customer accounts match your search.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Company / Type</th>
                  <th className="py-3 px-4">Segment</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Lifetime Value</th>
                  <th className="py-3 px-4 text-center">Last Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{c.name}</div>
                      <div className="text-[11px] text-gray-400">{c.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{c.companyName || '-'}</div>
                      <div className="text-[11px] text-gray-400">{c.businessType || c.country || ''}</div>
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
                      <Link href={'/admin/users/' + c.id}>
                        <Button size="sm" variant="ghost" className="rounded-xl text-[11px] h-7 px-2.5 gap-1 text-blue-600 hover:text-blue-700">
                          Profile
                          <ExternalLink size={12} />
                        </Button>
                      </Link>
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
