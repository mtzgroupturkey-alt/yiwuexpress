'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LocalizedFieldsForm, translationsArrayToInitial, TranslationRow } from '@/components/admin/LocalizedFieldsForm'
import { toast } from 'react-hot-toast'
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Search,
  CreditCard,
  Eye,
  RefreshCw,
  Loader2,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Receipt,
  X,
  Coins,
  Scale,
  FileSpreadsheet,
  Filter,
} from 'lucide-react'
import { useAdminLocale } from '../contexts/AdminLocaleContext'
import { localizeSupplier } from '@/lib/utils/localize'

interface SupplierSummary {
  totalSuppliers: number
  activeSuppliers: number
  totalPurchasedUSD: number
  totalPaidUSD: number
  totalBalanceUSD: number
  unsettledCount: number
}

interface Supplier {
  id: string
  name: string
  companyName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  contactPerson?: string | null
  taxId?: string | null
  paymentTerms?: string | null
  currency: string
  notes?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  totalPurchasedUSD: number
  totalPaidUSD: number
  balanceDueUSD: number
  purchasedByCurrency?: Record<string, number>
  paidByCurrency?: Record<string, number>
  balanceByCurrency?: Record<string, number>
  settlementStatus?: 'SETTLED' | 'OUTSTANDING'
  translations?: Array<{ locale: string; name?: string | null; description?: string | null; profileText?: string | null }>
  _count?: {
    purchaseOrders: number
  }
}

export default function SuppliersPage() {
  const { dict, locale } = useAdminLocale()
  const queryClient = useQueryClient()

  // State: Search & Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'DUE' | 'SETTLED'>('ALL')

  // State: Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  // State: Info Modal
  const [infoModalSupplier, setInfoModalSupplier] = useState<Supplier | null>(null)
  const handleExportSupplierExcel = async (supplierId: string, supplierName?: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`/api/admin/suppliers/${supplierId}/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to export statement')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeName = (supplierName || 'supplier').replace(/[^a-zA-Z0-9_-]/g, '_')
      a.download = `Supplier_Statement_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Excel statement downloaded successfully')
    } catch (err: any) {
      toast.error(err.message || 'Export failed')
    }
  }
  const [modalTab, setModalTab] = useState<'orders' | 'payments'>('orders')

  // State: Direct Payment Dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<Supplier | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    supplierId: '',
    purchaseOrderId: '',
    amount: '',
    currency: 'USD',
    paymentMethod: 'Bank Transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  })

  // 1. Fetch Suppliers with Balances & Summary
  const { data: responseData, isLoading, refetch } = useQuery<{
    suppliers: Supplier[]
    summary?: SupplierSummary
  }>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/suppliers')
      if (!res.ok) throw new Error('Failed to fetch suppliers')
      return res.json()
    },
  })

  // 2. Fetch Supplier Statement when Info Modal is open
  const { data: statementData, isLoading: isStatementLoading } = useQuery({
    queryKey: ['supplier-statement', infoModalSupplier?.id],
    queryFn: async () => {
      if (!infoModalSupplier?.id) return null
      const res = await fetch(`/api/admin/suppliers/${infoModalSupplier.id}/statement`)
      if (!res.ok) throw new Error('Failed to load supplier statement')
      return res.json()
    },
    enabled: !!infoModalSupplier?.id,
  })

  // 3. Create Supplier Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create supplier')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier created successfully')
      setIsDialogOpen(false)
      setEditingSupplier(null)
    },
    onError: () => {
      toast.error('Failed to create supplier')
    },
  })

  // 4. Update Supplier Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update supplier')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier updated successfully')
      setIsDialogOpen(false)
      setEditingSupplier(null)
    },
    onError: () => {
      toast.error('Failed to update supplier')
    },
  })

  // 5. Delete Supplier Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/suppliers/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete supplier')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier deleted successfully')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete supplier')
    },
  })

  // 6. Direct Supplier Payment Mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/admin/suppliers/${payload.supplierId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to record supplier payment')
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      if (infoModalSupplier?.id) {
        queryClient.invalidateQueries({ queryKey: ['supplier-statement', infoModalSupplier.id] })
      }
      const poNum = data?.data?.allocatedPoNumber ? ` (PO: ${data.data.allocatedPoNumber})` : ''
      toast.success(`Payment recorded successfully${poNum}`)
      setPaymentDialogOpen(false)
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record payment')
    },
  })

  const suppliersList = responseData?.suppliers || []
  const summary: SupplierSummary = responseData?.summary || {
    totalSuppliers: suppliersList.length,
    activeSuppliers: suppliersList.filter((s) => s.isActive).length,
    totalPurchasedUSD: suppliersList.reduce((acc, s) => acc + (s.totalPurchasedUSD || 0), 0),
    totalPaidUSD: suppliersList.reduce((acc, s) => acc + (s.totalPaidUSD || 0), 0),
    totalBalanceUSD: suppliersList.reduce((acc, s) => acc + (s.balanceDueUSD || 0), 0),
    unsettledCount: suppliersList.filter((s) => (s.balanceDueUSD || 0) > 0).length,
  }

  // Open Direct Payment Dialog
  const handleOpenPayment = (supplier?: Supplier, poId?: string, defaultAmt?: number, defaultCurr?: string) => {
    const target = supplier || suppliersList[0]
    setSelectedSupplierForPay(target || null)
    setPaymentForm({
      supplierId: target ? target.id : '',
      purchaseOrderId: poId || '',
      amount: defaultAmt ? String(defaultAmt) : (target && target.balanceDueUSD > 0 ? String(target.balanceDueUSD) : ''),
      currency: defaultCurr || target?.currency || 'USD',
      paymentMethod: 'Bank Transfer',
      paymentDate: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
    })
    setPaymentDialogOpen(true)
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentForm.supplierId) {
      toast.error('Please select a supplier')
      return
    }
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid positive payment amount')
      return
    }
    recordPaymentMutation.mutate({
      ...paymentForm,
      amount: parseFloat(paymentForm.amount),
    })
  }

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliersList.filter((supplier) => {
      const locSupplier = localizeSupplier(supplier as any, locale)
      const nameToMatch = (locSupplier.name || supplier.name || '').toLowerCase()
      const query = searchTerm.toLowerCase().trim()

      if (query) {
        const matchesName = nameToMatch.includes(query)
        const matchesCompany = (supplier.companyName || '').toLowerCase().includes(query)
        const matchesEmail = (supplier.email || '').toLowerCase().includes(query)
        const matchesContact = (supplier.contactPerson || '').toLowerCase().includes(query)
        if (!matchesName && !matchesCompany && !matchesEmail && !matchesContact) return false
      }

      if (statusFilter === 'ACTIVE' && !supplier.isActive) return false
      if (statusFilter === 'INACTIVE' && supplier.isActive) return false

      if (balanceFilter === 'DUE' && (supplier.balanceDueUSD || 0) <= 0) return false
      if (balanceFilter === 'SETTLED' && (supplier.balanceDueUSD || 0) > 0) return false

      return true
    })
  }, [suppliersList, searchTerm, statusFilter, balanceFilter, locale])

  const statement = statementData?.data

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#1a3a5c]" />
            {dict.suppliers.title}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitor supplier partner balances, multi-currency PO invoices, disbursements, and settle AP liabilities.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9 px-3 gap-1.5 text-xs text-gray-600 border-gray-300 hover:bg-gray-100"
            title="Refresh accounting records"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => handleOpenPayment()}
            className="h-9 px-3.5 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
          >
            <CreditCard className="w-4 h-4" />
            <span>Record Payment</span>
          </Button>
          <Button
            onClick={() => {
              setEditingSupplier(null)
              setIsDialogOpen(true)
            }}
            className="h-9 px-3.5 gap-1.5 text-xs font-semibold bg-[#1a3a5c] hover:bg-[#1a3a5c]/90 text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{dict.suppliers.addSupplier}</span>
          </Button>
        </div>
      </div>

      {/* Accounting KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Suppliers Count */}
        <Card className="border border-gray-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Suppliers
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-gray-900">{summary.totalSuppliers}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>{summary.activeSuppliers} active partners</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Total Invoiced Volume */}
        <Card className="border border-blue-200/80 shadow-xs bg-blue-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-900">
              Total Invoiced (USD)
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-blue-900 font-mono">
              ${summary.totalPurchasedUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-blue-800/80 mt-1">Normalized base purchase volume</p>
          </CardContent>
        </Card>

        {/* 3. Total Paid Volume */}
        <Card className="border border-emerald-200/80 shadow-xs bg-emerald-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
              Total Paid (USD)
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono">
              ${summary.totalPaidUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-800/80 mt-1">Cleared supplier disbursements</p>
          </CardContent>
        </Card>

        {/* 4. Total Balance Due / Net Credit Position */}
        <Card
          className={`border shadow-xs ${
            summary.totalBalanceUSD > 0.01
              ? 'border-amber-200/90 bg-amber-50/25'
              : summary.totalBalanceUSD < -0.01
              ? 'border-blue-200/90 bg-blue-50/25'
              : 'border-emerald-200/90 bg-emerald-50/20'
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              className={`text-xs font-semibold uppercase tracking-wider ${
                summary.totalBalanceUSD > 0.01
                  ? 'text-amber-900'
                  : summary.totalBalanceUSD < -0.01
                  ? 'text-blue-900'
                  : 'text-emerald-900'
              }`}
            >
              {summary.totalBalanceUSD < -0.01 ? 'Net AP Position (Credit)' : 'Outstanding AP Balance'}
            </CardTitle>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                summary.totalBalanceUSD > 0.01
                  ? 'bg-amber-100 text-amber-700'
                  : summary.totalBalanceUSD < -0.01
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {summary.totalBalanceUSD > 0.01 ? (
                <TrendingUp className="w-4 h-4" />
              ) : summary.totalBalanceUSD < -0.01 ? (
                <Coins className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-extrabold font-mono ${
                summary.totalBalanceUSD > 0.01
                  ? 'text-amber-800'
                  : summary.totalBalanceUSD < -0.01
                  ? 'text-blue-800'
                  : 'text-emerald-700'
              }`}
            >
              {summary.totalBalanceUSD < -0.01 ? '-' : ''}${Math.abs(summary.totalBalanceUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p
              className={`text-xs mt-1 ${
                summary.totalBalanceUSD > 0.01
                  ? 'text-amber-800/80 font-medium'
                  : summary.totalBalanceUSD < -0.01
                  ? 'text-blue-800/80 font-medium'
                  : 'text-emerald-800/80'
              }`}
            >
              {summary.totalBalanceUSD > 0.01
                ? `${summary.unsettledCount} supplier(s) with pending balance`
                : summary.totalBalanceUSD < -0.01
                ? `Net credit position across suppliers`
                : 'All supplier balances fully settled'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1a3a5c]" />
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Filter & Search Suppliers
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Showing <strong className="text-gray-900 font-bold">{filteredSuppliers.length}</strong> of <strong className="text-gray-900 font-bold">{suppliersList.length}</strong> partners</span>
            {(searchTerm || statusFilter !== 'ALL' || balanceFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('ALL')
                  setBalanceFilter('ALL')
                }}
                className="h-7 px-2 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium gap-1"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search supplier name, company, contact person, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-9 h-10 text-xs border-gray-300 rounded-lg bg-gray-50/50 hover:bg-white focus:bg-white focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/15 transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <Select
              value={statusFilter}
              onValueChange={(val: any) => setStatusFilter(val)}
            >
              <SelectTrigger className="h-10 text-xs border-gray-300 rounded-lg bg-gray-50/50 hover:bg-white focus:bg-white shadow-2xs">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active Suppliers Only</SelectItem>
                <SelectItem value="INACTIVE">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Balance Filter */}
          <div>
            <Select
              value={balanceFilter}
              onValueChange={(val: any) => setBalanceFilter(val)}
            >
              <SelectTrigger className="h-10 text-xs border-gray-300 rounded-lg bg-gray-50/50 hover:bg-white focus:bg-white shadow-2xs">
                <SelectValue placeholder="Balance Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Balances</SelectItem>
                <SelectItem value="DUE">Outstanding Balance (&gt; $0)</SelectItem>
                <SelectItem value="SETTLED">Settled ($0.00)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Suppliers Table: Clear Multi-Currency Grouping Breakdown */}
      <Card className="border-gray-200/80 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 border-4 border-gray-200 border-t-[#1a3a5c] rounded-full animate-spin text-[#1a3a5c]" />
            </div>
          ) : (
            <div className="overflow-x-auto relative">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                    <TableHead className="py-3 px-4 w-12 text-center text-gray-400">#</TableHead>
                    <TableHead className="py-3 px-4 min-w-[200px]">{dict.suppliers.supplierName}</TableHead>
                    <TableHead className="py-3 px-4 min-w-[90px] text-center">POs</TableHead>
                    <TableHead className="py-3 px-4 min-w-[170px] text-right">Total Invoiced</TableHead>
                    <TableHead className="py-3 px-4 min-w-[170px] text-right">Total Paid</TableHead>
                    <TableHead className="py-3 px-4 min-w-[190px] text-right">Balance Due</TableHead>
                    <TableHead className="py-3 px-4 min-w-[100px] text-center">{dict.common.status}</TableHead>
                    <TableHead className="py-3 px-4 min-w-[160px] text-right sticky right-0 z-20 bg-gray-100/95 backdrop-blur-sm border-l border-gray-200/90 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]">
                      {dict.common.actions}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {filteredSuppliers && filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier, index) => {
                      const loc = localizeSupplier(supplier as any, locale)
                      const hasDue = (supplier.balanceDueUSD || 0) > 0
                      const displayName = loc.name || supplier.name

                      const purchasedCurrs = Object.entries(supplier.purchasedByCurrency || {})
                      const paidCurrs = Object.entries(supplier.paidByCurrency || {})
                      const balanceCurrs = Object.entries(supplier.balanceByCurrency || {})

                      return (
                        <TableRow key={supplier.id} className="hover:bg-gray-50/70 transition-colors group">
                          {/* Index */}
                          <TableCell className="py-3 px-4 text-center font-mono text-xs text-gray-400">
                            {index + 1}
                          </TableCell>

                          {/* Supplier Name & Info Modal Trigger */}
                          <TableCell className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => setInfoModalSupplier(supplier)}
                              className="text-left group/btn block"
                              title="Click to view detailed supplier profile & accounting ledger"
                            >
                              <div className="font-bold text-gray-900 group-hover/btn:text-[#1a3a5c] group-hover/btn:underline flex items-center gap-1.5">
                                <span>{displayName}</span>
                                <Eye className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                              </div>
                              {supplier.companyName && (
                                <div className="text-xs text-gray-500 font-normal mt-0.5">
                                  {supplier.companyName}
                                </div>
                              )}
                            </button>
                          </TableCell>

                          {/* Purchase Orders Count */}
                          <TableCell className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setInfoModalSupplier(supplier)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                              title="View purchase orders for this supplier"
                            >
                              <FileText className="w-3 h-3 text-blue-600" />
                              <span>{supplier._count?.purchaseOrders || 0} POs</span>
                            </button>
                          </TableCell>

                          {/* Total Invoiced Volume (USD Converted + Native Currency Pills) */}
                          <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="font-mono font-bold text-gray-900 text-xs">
                              ${(supplier.totalPurchasedUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            {purchasedCurrs.length > 0 && (
                              <div className="flex flex-wrap items-center justify-end gap-1 mt-1">
                                {purchasedCurrs.map(([curr, amt]) => (
                                  <span
                                    key={curr}
                                    className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-100 font-medium"
                                  >
                                    {curr} {amt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </span>
                                ))}
                              </div>
                            )}
                          </TableCell>

                          {/* Total Paid Volume (USD Converted + Native Currency Pills) */}
                          <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setInfoModalSupplier(supplier)}
                              className="text-emerald-700 hover:text-emerald-900 font-mono font-bold text-xs hover:underline flex items-center justify-end gap-1 w-full"
                              title="Click to inspect payment history"
                            >
                              <span>${(supplier.totalPaidUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <CreditCard className="w-3 h-3 text-emerald-600" />
                            </button>
                            {paidCurrs.length > 0 ? (
                              <div className="flex flex-wrap items-center justify-end gap-1 mt-1">
                                {paidCurrs.map(([curr, amt]) => (
                                  <span
                                    key={curr}
                                    className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-100 font-medium"
                                  >
                                    {curr} {amt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">$0.00 disbursed</div>
                            )}
                          </TableCell>

                          {/* Balance Due / Credit Position (Outstanding vs Credit vs Settled + Native Currency Grouping) */}
                          <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                            {(supplier.balanceDueUSD || 0) > 0.01 ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-bold border border-amber-200 bg-amber-50 text-amber-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  ${(supplier.balanceDueUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Due
                                </span>
                                {balanceCurrs.length > 0 && (
                                  <div className="flex flex-wrap items-center justify-end gap-1">
                                    {balanceCurrs.map(([curr, amt]) => {
                                      if (Math.abs(amt) <= 0.01) return null
                                      const isCurDue = amt > 0.01
                                      return (
                                        <span
                                          key={curr}
                                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                                            isCurDue ? 'bg-amber-100/70 text-amber-900' : 'bg-blue-100/70 text-blue-900'
                                          }`}
                                        >
                                          {curr} {Math.abs(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {isCurDue ? 'Due' : 'Credit'}
                                        </span>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (supplier.balanceDueUSD || 0) < -0.01 ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-bold border border-blue-200 bg-blue-50 text-blue-800">
                                  <Coins className="w-3 h-3 text-blue-600" />
                                  -${Math.abs(supplier.balanceDueUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Credit
                                </span>
                                {balanceCurrs.length > 0 && (
                                  <div className="flex flex-wrap items-center justify-end gap-1">
                                    {balanceCurrs.map(([curr, amt]) => {
                                      if (Math.abs(amt) <= 0.01) return null
                                      const isCurDue = amt > 0.01
                                      return (
                                        <span
                                          key={curr}
                                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                                            isCurDue ? 'bg-amber-100/70 text-amber-900' : 'bg-blue-100/70 text-blue-900'
                                          }`}
                                        >
                                          {curr} {Math.abs(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {isCurDue ? 'Due' : 'Credit'}
                                        </span>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Settled ($0.00)
                              </span>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3 px-4 text-center whitespace-nowrap">
                            <Badge variant={supplier.isActive ? 'default' : 'secondary'} className="text-[10px] uppercase font-semibold">
                              {supplier.isActive ? dict.common.active : dict.common.inactive}
                            </Badge>
                          </TableCell>

                          {/* Actions: Info Modal, Record Payment, Edit, Delete */}
                          <TableCell className="py-3 px-4 text-right sticky right-0 z-20 bg-white/95 backdrop-blur-sm border-l border-gray-100">
                            <div className="flex items-center justify-end gap-1">
                              {/* Dedicated Full Page Statement Link */}
                              <Link href={`/admin/suppliers/${supplier.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-50"
                                  title="Open Full Statement & Ledger Page"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              </Link>

                              {/* Quick View Details Info Modal Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setModalTab('orders')
                                  setInfoModalSupplier(supplier)
                                }}
                                className="h-8 px-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                title="Quick Preview Modal"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              {/* Quick Direct Payment Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenPayment(supplier)}
                                className="h-8 px-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                title="Record Payment for Supplier"
                              >
                                <CreditCard className="w-4 h-4" />
                              </Button>

                              {/* Edit Supplier */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingSupplier(supplier)
                                  setIsDialogOpen(true)
                                }}
                                className="h-8 px-2 text-gray-600 hover:text-gray-900"
                                title="Edit Supplier Details"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>

                              {/* Delete Supplier */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${supplier.name}?`)) {
                                    deleteMutation.mutate(supplier.id)
                                  }
                                }}
                                className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Delete Supplier"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-16">
                        <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="font-semibold text-gray-700">{dict.common.noData}</p>
                        <p className="text-xs text-gray-400 mt-1">No supplier records match your filters.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                {filteredSuppliers && filteredSuppliers.length > 0 && (() => {
                  const invoicedByCurr: Record<string, number> = {}
                  const paidByCurr: Record<string, number> = {}
                  const balanceByCurr: Record<string, number> = {}

                  filteredSuppliers.forEach((s) => {
                    Object.entries(s.purchasedByCurrency || {}).forEach(([curr, amt]) => {
                      invoicedByCurr[curr] = (invoicedByCurr[curr] || 0) + (amt || 0)
                    })
                    Object.entries(s.paidByCurrency || {}).forEach(([curr, amt]) => {
                      paidByCurr[curr] = (paidByCurr[curr] || 0) + (amt || 0)
                    })
                    Object.entries(s.balanceByCurrency || {}).forEach(([curr, amt]) => {
                      balanceByCurr[curr] = (balanceByCurr[curr] || 0) + (amt || 0)
                    })
                  })

                  const invCurrs = Object.entries(invoicedByCurr).filter(([_, a]) => Math.abs(a) > 0.01)
                  const paidCurrs = Object.entries(paidByCurr).filter(([_, a]) => Math.abs(a) > 0.01)
                  const balCurrs = Object.entries(balanceByCurr).filter(([_, a]) => Math.abs(a) > 0.01)

                  return (
                    <tfoot className="bg-slate-100/95 border-t-2 border-slate-300 font-semibold text-xs">
                      {/* Row 1: Converted USD Grand Totals */}
                      <TableRow className="border-b border-slate-200/80 bg-slate-100">
                        <TableCell colSpan={3} className="py-3 px-4 text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-900">
                              Grand Total ({filteredSuppliers.length} Suppliers):
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              Normalized Base (USD)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-mono font-extrabold text-blue-950 whitespace-nowrap text-xs">
                          ${`${filteredSuppliers.reduce((acc, s) => acc + (s.totalPurchasedUSD || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-mono font-extrabold text-emerald-800 whitespace-nowrap text-xs">
                          ${`${filteredSuppliers.reduce((acc, s) => acc + (s.totalPaidUSD || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-mono font-extrabold whitespace-nowrap text-xs">
                          {(() => {
                            const netTotal = filteredSuppliers.reduce((acc, s) => acc + (s.balanceDueUSD || 0), 0)
                            const isCredit = netTotal < -0.01
                            const isDue = netTotal > 0.01
                            return (
                              <span
                                className={`px-2 py-0.5 rounded border font-mono ${
                                  isCredit
                                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                                    : isDue
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                }`}
                              >
                                {isCredit ? '-' : ''}${Math.abs(netTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {isCredit ? '(Credit)' : isDue ? '(Due)' : '(Settled)'}
                              </span>
                            )
                          })()}
                        </TableCell>
                        <TableCell colSpan={2} className="py-3 px-4 bg-slate-100 sticky right-0 z-20 border-l border-gray-200/90" />
                      </TableRow>

                      {/* Row 2: Native Currency Grouped Totals Breakdown */}
                      <TableRow className="bg-slate-50 border-b border-slate-200/60">
                        <TableCell colSpan={3} className="py-2.5 px-4 text-slate-600">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Native Currencies Breakdown:
                          </span>
                        </TableCell>

                        {/* Invoiced native breakdown */}
                        <TableCell className="py-2.5 px-4 text-right whitespace-nowrap">
                          {invCurrs.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              {invCurrs.map(([curr, amt]) => (
                                <span
                                  key={curr}
                                  className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-100/70 text-blue-900 rounded font-bold border border-blue-200/80"
                                >
                                  {curr} {amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 font-mono text-[11px]">—</span>
                          )}
                        </TableCell>

                        {/* Paid native breakdown */}
                        <TableCell className="py-2.5 px-4 text-right whitespace-nowrap">
                          {paidCurrs.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              {paidCurrs.map(([curr, amt]) => (
                                <span
                                  key={curr}
                                  className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-100/80 text-emerald-900 rounded font-bold border border-emerald-200/80"
                                >
                                  {curr} {amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 font-mono text-[11px]">—</span>
                          )}
                        </TableCell>

                        {/* Balance due / credit native breakdown */}
                        <TableCell className="py-2.5 px-4 text-right whitespace-nowrap">
                          {balCurrs.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              {balCurrs.map(([curr, amt]) => {
                                const isCurDue = amt > 0.01
                                const isCurCredit = amt < -0.01
                                return (
                                  <span
                                    key={curr}
                                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border ${
                                      isCurDue
                                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                                        : isCurCredit
                                        ? 'bg-blue-100 text-blue-900 border-blue-300'
                                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    }`}
                                  >
                                    {curr} {Math.abs(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {isCurDue ? 'Due' : isCurCredit ? 'Credit' : 'Settled'}
                                  </span>
                                )
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-400 font-mono text-[11px]">—</span>
                          )}
                        </TableCell>

                        <TableCell colSpan={2} className="py-2.5 px-4 bg-slate-50 sticky right-0 z-20 border-l border-gray-200/90" />
                      </TableRow>
                    </tfoot>
                  )
                })()}
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: Supplier Info & Accounting Ledger Details with Multi-Currency Reconciliation */}
      {infoModalSupplier && (
        <Dialog open={!!infoModalSupplier} onOpenChange={(open) => !open && setInfoModalSupplier(null)}>
          <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col p-0">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-gray-900">
                    {localizeSupplier(infoModalSupplier as any, locale).name || infoModalSupplier.name}
                  </h2>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      (statement?.summary?.balanceDueUSD ?? infoModalSupplier.balanceDueUSD ?? 0) > 0.01
                        ? 'bg-amber-100 text-amber-800'
                        : (statement?.summary?.balanceDueUSD ?? infoModalSupplier.balanceDueUSD ?? 0) < -0.01
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {(statement?.summary?.balanceDueUSD ?? infoModalSupplier.balanceDueUSD ?? 0) > 0.01
                      ? 'OUTSTANDING BALANCE'
                      : (statement?.summary?.balanceDueUSD ?? infoModalSupplier.balanceDueUSD ?? 0) < -0.01
                      ? 'CREDIT BALANCE'
                      : 'SETTLED'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1.5">
                  {infoModalSupplier.companyName && (
                    <span className="flex items-center gap-1 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      {infoModalSupplier.companyName}
                    </span>
                  )}
                  {infoModalSupplier.contactPerson && (
                    <span>Contact: {infoModalSupplier.contactPerson}</span>
                  )}
                  {infoModalSupplier.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <a href={`mailto:${infoModalSupplier.email}`} className="hover:underline text-blue-600">
                        {infoModalSupplier.email}
                      </a>
                    </span>
                  )}
                  {infoModalSupplier.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <a href={`tel:${infoModalSupplier.phone}`} className="hover:underline font-mono">
                        {infoModalSupplier.phone}
                      </a>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/suppliers/${infoModalSupplier.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Dedicated Statement Page</span>
                </Link>
              </div>
            </div>

            {/* Overall Converted Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 pb-2">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[11px] font-bold uppercase text-gray-500 block">Total POs</span>
                <span className="text-lg font-black text-gray-900">
                  {statement?.summary?.totalOrders ?? infoModalSupplier._count?.purchaseOrders ?? 0}
                </span>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <span className="text-[11px] font-bold uppercase text-blue-700 block">Total Invoiced (USD)</span>
                <span className="text-lg font-black text-blue-950 font-mono">
                  ${(statement?.summary?.totalPurchasedUSD ?? infoModalSupplier.totalPurchasedUSD ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-[11px] font-bold uppercase text-emerald-700 block">Total Paid (USD)</span>
                <span className="text-lg font-black text-emerald-700 font-mono">
                  ${(statement?.summary?.totalPaidUSD ?? infoModalSupplier.totalPaidUSD ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {(() => {
                const bal = statement?.summary?.balanceDueUSD ?? infoModalSupplier.balanceDueUSD ?? 0
                const isDue = bal > 0.01
                const isCredit = bal < -0.01
                return (
                  <div className={`p-3 rounded-xl border ${
                    isDue ? 'bg-amber-50/50 border-amber-100' : isCredit ? 'bg-blue-50/50 border-blue-100' : 'bg-emerald-50/50 border-emerald-100'
                  }`}>
                    <span className={`text-[11px] font-bold uppercase block ${
                      isDue ? 'text-amber-700' : isCredit ? 'text-blue-700' : 'text-emerald-700'
                    }`}>
                      {isCredit ? 'Net Credit Available (USD)' : 'Balance Due (USD)'}
                    </span>
                    <span className={`text-lg font-black font-mono ${
                      isDue ? 'text-amber-800' : isCredit ? 'text-blue-800' : 'text-emerald-700'
                    }`}>
                      {isCredit ? '-' : ''}${Math.abs(bal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )
              })()}
            </div>

            {/* Currency Ledger Breakdown Card (CFO / Controller View) */}
            {statement?.summary?.currencyLedgerSummary && statement.summary.currencyLedgerSummary.length > 0 && (
              <div className="px-6 py-2">
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      Currency-by-Currency Accounting Breakdown
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Accounting values in native transaction currencies
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                    {statement.summary.currencyLedgerSummary.map((item: any) => {
                      const isZero = Math.abs(item.balanceDue || 0) <= 0.01
                      const isCredit = (item.balanceDue || 0) < -0.01
                      const isDue = (item.balanceDue || 0) > 0.01
                      return (
                        <div key={item.currency} className="bg-white rounded-lg p-2.5 border border-slate-200 shadow-2xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                              {item.currency} Account
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isZero
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : isCredit
                                  ? 'bg-blue-50 text-blue-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {isZero ? 'SETTLED' : isCredit ? 'CREDIT' : 'DUE'}
                            </span>
                          </div>
                          <div className="space-y-0.5 text-xs">
                            <div className="flex justify-between text-slate-500">
                              <span>Invoiced:</span>
                              <span className="font-mono font-medium text-slate-800">
                                {item.currency} {item.totalPurchased.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>Paid:</span>
                              <span className="font-mono font-medium text-emerald-700">
                                {item.currency} {item.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-slate-100 font-bold">
                              <span className="text-slate-700">{isCredit ? 'Credit Available:' : 'Balance Due:'}</span>
                              <span className={`font-mono ${isZero ? 'text-emerald-600' : isCredit ? 'text-blue-700' : 'text-amber-800'}`}>
                                {item.currency} {Math.abs(item.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Information & Address */}
            <div className="px-6 py-1">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 font-medium block text-[11px]">Address:</span>
                  <span className="text-gray-800">{infoModalSupplier.address || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block text-[11px]">Tax ID / License:</span>
                  <span className="text-gray-800 font-mono">{infoModalSupplier.taxId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block text-[11px]">Payment Terms & Default Currency:</span>
                  <span className="text-gray-800 uppercase font-semibold">
                    {infoModalSupplier.paymentTerms || 'Standard'} ({infoModalSupplier.currency || 'USD'})
                  </span>
                </div>
                {infoModalSupplier.notes && (
                  <div className="sm:col-span-3 pt-1 border-t border-gray-200/60">
                    <span className="text-gray-400 font-medium block text-[11px]">Internal Notes:</span>
                    <span className="text-gray-700 italic">{infoModalSupplier.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Orders & Payments Tabbed History */}
            <div className="px-6 pt-3 pb-1 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setModalTab('orders')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    modalTab === 'orders'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Purchase Orders ({statement?.orders?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('payments')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    modalTab === 'payments'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Recorded Payments ({statement?.payments?.length || 0})</span>
                </button>
              </div>

              {modalTab === 'orders' ? (
                <Link
                  href={`/admin/purchase-orders/new?supplierId=${infoModalSupplier.id}`}
                  className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <span>+ New PO for this Supplier</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const sup = infoModalSupplier
                    setInfoModalSupplier(null)
                    handleOpenPayment(sup)
                  }}
                  className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <span>+ Record Payment</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {modalTab === 'orders' ? (
                <div>

                {isStatementLoading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <span className="text-xs text-gray-400 mt-2 block">Loading ledger records...</span>
                  </div>
                ) : !statement?.orders || statement.orders.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                    No purchase orders recorded for this supplier.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3">PO Number</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Order Total (Invoiced)</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {statement.orders.map((po: any) => {
                          return (
                            <tr key={po.id} className="hover:bg-gray-50/60">
                              <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                                <Link href={`/admin/purchase-orders/${po.id}/edit`} className="hover:text-blue-600 hover:underline">
                                  {po.poNumber}
                                </Link>
                              </td>
                              <td className="py-2.5 px-3 text-gray-500">
                                {new Date(po.orderDate).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                                  {po.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium text-gray-900 font-mono">
                                {po.currency} {po.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <Link href={`/admin/purchase-orders/${po.id}/edit`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-[11px] text-[#1a3a5c] border-gray-200 hover:bg-gray-100 gap-1 font-semibold"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View PO</span>
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      {statement?.orders && statement.orders.length > 0 && (() => {
                        const totalsByCurr: Record<string, number> = {}
                        statement.orders.forEach((o: any) => {
                          const c = (o.currency || 'USD').toUpperCase()
                          totalsByCurr[c] = (totalsByCurr[c] || 0) + (o.total || 0)
                        })
                        const entries = Object.entries(totalsByCurr)
                        return (
                          <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-xs">
                            {entries.map(([curr, totalAmt], idx) => (
                              <tr key={curr} className="border-b border-slate-200/60">
                                <td colSpan={3} className="py-2 px-3 text-slate-700">
                                  {idx === 0 ? (
                                    <span className="font-bold text-[10px] uppercase tracking-wider text-slate-800">
                                      Total Invoiced ({statement.orders.length} POs):
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px] italic">Subtotal:</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                  <span className="bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded border border-blue-200">
                                    {curr} {totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </td>
                                <td className="py-2 px-3" />
                              </tr>
                            ))}
                          </tfoot>
                        )
                      })()}
                    </table>
                  </div>
                )}
              </div>
              ) : (
                <div>
                {!statement?.payments || statement.payments.length === 0 ? (
                  <div className="py-4 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                    No disbursement payments recorded yet.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">PO Linked</th>
                          <th className="py-2 px-3">Method</th>
                          <th className="py-2 px-3">Reference #</th>
                          <th className="py-2 px-3 text-right">Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {statement.payments.map((p: any) => (
                          <tr key={p.id} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 text-gray-500">
                              {new Date(p.paymentDate).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3 font-mono font-medium text-gray-800">
                              {p.poNumber || 'Direct Account'}
                              {p.poCurrency && (
                                <span className="text-[10px] text-gray-400 ml-1">({p.poCurrency})</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-gray-600">{p.paymentMethod}</td>
                            <td className="py-2 px-3 text-gray-500 font-mono">{p.reference || '—'}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                              {p.currency} {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {statement?.payments && statement.payments.length > 0 && (() => {
                        const totalsByCurr: Record<string, number> = {}
                        statement.payments.forEach((p: any) => {
                          const c = (p.currency || 'USD').toUpperCase()
                          totalsByCurr[c] = (totalsByCurr[c] || 0) + (p.amount || 0)
                        })
                        const entries = Object.entries(totalsByCurr)
                        return (
                          <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-xs">
                            {entries.map(([curr, totalAmt], idx) => (
                              <tr key={curr} className="border-b border-slate-200/60">
                                <td colSpan={4} className="py-2 px-3 text-slate-700">
                                  {idx === 0 ? (
                                    <span className="font-bold text-[10px] uppercase tracking-wider text-slate-800">
                                      Total Paid ({statement.payments.length} Payments):
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px] italic">Subtotal:</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                                  <span className="bg-emerald-50 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-200">
                                    {curr} {totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tfoot>
                        )
                      })()}
                    </table>
                  </div>
                )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    const sup = infoModalSupplier
                    setInfoModalSupplier(null)
                    handleOpenPayment(sup)
                  }}
                  className="h-9 px-4 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Record Payment for this Supplier</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportSupplierExcel(infoModalSupplier.id, infoModalSupplier.name)}
                  className="h-9 px-3 gap-1.5 text-xs text-emerald-800 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100"
                  title="Download full statement in Excel format (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Excel</span>
                </Button>
                <Link href={`/admin/suppliers/${infoModalSupplier.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 gap-1.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Dedicated Statement Page</span>
                  </Button>
                </Link>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInfoModalSupplier(null)}
                className="h-9 px-4 text-xs"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 2: Record Payment Directly to Supplier or Specific PO */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>Record Supplier Payment</span>
            </DialogTitle>
            <DialogDescription>
              Disburse payment to supplier account or settle specific purchase orders directly.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
            {/* Supplier Picker */}
            <div>
              <Label htmlFor="paySupplier" className="text-xs font-semibold">Supplier / Factory *</Label>
              <Select
                value={paymentForm.supplierId}
                onValueChange={(val) => {
                  const s = suppliersList.find((sup) => sup.id === val)
                  setSelectedSupplierForPay(s || null)
                  setPaymentForm((prev) => ({
                    ...prev,
                    supplierId: val,
                    currency: s?.currency || 'USD',
                    purchaseOrderId: '',
                    amount: s && s.balanceDueUSD > 0 ? String(s.balanceDueUSD) : prev.amount,
                  }))
                }}
              >
                <SelectTrigger id="paySupplier" className="h-10 text-xs">
                  <SelectValue placeholder="Select supplier partner" />
                </SelectTrigger>
                <SelectContent>
                  {suppliersList.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name} {s.balanceDueUSD > 0 ? ` (Due: ${s.balanceDueUSD.toFixed(2)})` : ' (Settled)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target PO (Optional Selection) */}
            {selectedSupplierForPay && (
              <div>
                <Label htmlFor="payPo" className="text-xs font-semibold">Purchase Order (Optional Allocation)</Label>
                <Input
                  id="payPo"
                  placeholder="Auto-allocate to oldest open PO (or enter PO ID)"
                  value={paymentForm.purchaseOrderId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, purchaseOrderId: e.target.value })}
                  className="h-10 text-xs font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Leave blank to disburse total account payment across all open invoices (FIFO waterfall).
                </p>
              </div>
            )}

            {/* Amount & Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="payAmount" className="text-xs font-semibold">Payment Amount *</Label>
                <Input
                  id="payAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                  className="h-10 font-mono text-sm"
                />
              </div>
              <div>
                <Label htmlFor="payCurrency" className="text-xs font-semibold">Currency</Label>
                <select
                  id="payCurrency"
                  value={paymentForm.currency}
                  onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 text-xs font-mono font-medium"
                >
                  <option value="USD">USD</option>
                  <option value="CNY">CNY / RMB</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="BYN">BYN</option>
                  <option value="RUB">RUB</option>
                </select>
              </div>
            </div>

            {/* Payment Method & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="payMethod" className="text-xs font-semibold">Method</Label>
                <select
                  id="payMethod"
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 text-xs"
                >
                  <option value="Bank Transfer">Bank Transfer (TT)</option>
                  <option value="Cash">Cash</option>
                  <option value="WeChat Pay">WeChat Pay</option>
                  <option value="Alipay">Alipay</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>
              <div>
                <Label htmlFor="payDate" className="text-xs font-semibold">Payment Date</Label>
                <Input
                  id="payDate"
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="h-10 text-xs font-mono"
                />
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <Label htmlFor="payRef" className="text-xs font-semibold">Reference / Transfer Receipt #</Label>
              <Input
                id="payRef"
                placeholder="e.g. TT-984210, Bank Tx ID"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                className="h-10 text-xs font-mono"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="payNotes" className="text-xs font-semibold">Payment Memo / Notes</Label>
              <Textarea
                id="payNotes"
                placeholder="Optional payment notes or instructions"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                rows={2}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentDialogOpen(false)}
                disabled={recordPaymentMutation.isPending}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={recordPaymentMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
              >
                {recordPaymentMutation.isPending ? 'Recording...' : 'Confirm Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Create / Edit Supplier Profile */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? dict.suppliers.editSupplier : dict.suppliers.addSupplier}</DialogTitle>
            <DialogDescription>
              {editingSupplier ? dict.suppliers.editSupplier : dict.suppliers.addSupplier}
            </DialogDescription>
          </DialogHeader>
          <SupplierForm
            dict={dict}
            initialData={editingSupplier}
            onSave={(data) => {
              if (editingSupplier) {
                updateMutation.mutate({ id: editingSupplier.id, data })
              } else {
                createMutation.mutate(data)
              }
            }}
            onCancel={() => {
              setIsDialogOpen(false)
              setEditingSupplier(null)
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SupplierForm({
  initialData,
  onSave,
  onCancel,
  isSubmitting,
  dict,
}: {
  initialData: Supplier | null
  onSave: (data: any) => void
  onCancel: () => void
  isSubmitting: boolean
  dict: any
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    companyName: initialData?.companyName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    contactPerson: initialData?.contactPerson || '',
    taxId: initialData?.taxId || '',
    paymentTerms: initialData?.paymentTerms || '',
    currency: initialData?.currency || 'USD',
    notes: initialData?.notes || '',
    isActive: initialData?.isActive ?? true,
  })
  const [translations, setTranslations] = useState<TranslationRow[]>(
    translationsArrayToInitial((initialData?.translations || []).map((t) => ({
      locale: t.locale,
      name: t.name || '',
      description: t.description || '',
      profileText: t.profileText || '',
    })))
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      translations: [
        { locale: 'en', name: formData.name, description: formData.notes, profileText: formData.companyName },
        ...translations,
      ],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">{dict.suppliers.supplierName} *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="companyName">{dict.suppliers.companyName}</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">{dict.suppliers.email}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="phone">{dict.suppliers.phone}</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">{dict.suppliers.address}</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactPerson">{dict.suppliers.contactPerson}</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="taxId">{dict.suppliers.taxId}</Label>
          <Input
            id="taxId"
            value={formData.taxId}
            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="paymentTerms">{dict.suppliers.paymentTerms}</Label>
          <select
            id="paymentTerms"
            value={formData.paymentTerms}
            onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
            className="w-full h-10 px-3 rounded-md border border-gray-300 text-xs"
          >
            <option value="">Select...</option>
            <option value="prepayment">Prepayment</option>
            <option value="net30">Net 30</option>
            <option value="net60">Net 60</option>
            <option value="net90">Net 90</option>
          </select>
        </div>
        <div>
          <Label htmlFor="currency">{dict.suppliers.currency}</Label>
          <select
            id="currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full h-10 px-3 rounded-md border border-gray-300 text-xs"
          >
            <option value="USD">USD</option>
            <option value="CNY">CNY</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">{dict.suppliers.notes}</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-4 h-4"
        />
        <Label htmlFor="isActive">{dict.suppliers.active}</Label>
      </div>

      <div>
        <Label className="mb-2 block">{dict.suppliers.localizedFields}</Label>
        <LocalizedFieldsForm
          fields={[
            { key: 'name', label: dict.common.name },
            { key: 'description', label: dict.products.description },
            { key: 'profileText', label: dict.suppliers.companyName, textarea: true },
          ]}
          initialValues={translations}
          onChange={setTranslations}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {dict.common.cancel}
        </Button>
        <Button type="submit" className="bg-[#1a3a5c] text-white" disabled={isSubmitting}>
          {isSubmitting ? dict.common.saving : dict.suppliers.saveSupplier}
        </Button>
      </DialogFooter>
    </form>
  )
}
