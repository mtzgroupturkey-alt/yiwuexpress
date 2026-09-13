'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Coins,
  Receipt,
  Calendar,
  Printer,
  Download,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Hash,
} from 'lucide-react'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'
import { localizeSupplier } from '@/lib/utils/localize'

export default function SupplierStatementPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { dict, locale } = useAdminLocale()
  const supplierId = params.id as string

  // State: Payment Dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedPoId, setSelectedPoId] = useState('')
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currency: 'USD',
    paymentMethod: 'Bank Transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  })

  // State: Search / Filter inside statement
  const [poFilter, setPoFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL')
  const [activeTab, setActiveTab] = useState<'ALL' | 'ORDERS' | 'PAYMENTS'>('ALL')

  // Print Statement Handler
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  // Export to Excel Handler
  const [isExporting, setIsExporting] = useState(false)
  const handleExportExcel = async () => {
    try {
      setIsExporting(true)
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
      const safeName = (supplier?.name || 'supplier').replace(/[^a-zA-Z0-9_-]/g, '_')
      a.download = `Supplier_Statement_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Excel statement downloaded successfully')
    } catch (err: any) {
      toast.error(err.message || 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  // Fetch Full Supplier Statement
  const { data: statementResponse, isLoading, refetch } = useQuery({
    queryKey: ['supplier-statement', supplierId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/suppliers/${supplierId}/statement`)
      if (!res.ok) throw new Error('Failed to fetch supplier statement')
      return res.json()
    },
    enabled: !!supplierId,
  })

  // Record Payment Mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/admin/suppliers/${supplierId}/payments`, {
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
      queryClient.invalidateQueries({ queryKey: ['supplier-statement', supplierId] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      const poNum = data?.data?.allocatedPoNumber ? ` (PO: ${data.data.allocatedPoNumber})` : ''
      toast.success(`Payment recorded successfully${poNum}`)
      setPaymentDialogOpen(false)
      setPaymentForm({
        amount: '',
        currency: 'USD',
        paymentMethod: 'Bank Transfer',
        paymentDate: new Date().toISOString().split('T')[0],
        reference: '',
        notes: '',
      })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record payment')
    },
  })

  const statement = statementResponse?.data
  const supplier = statement?.supplier
  const summary = statement?.summary

  const handleOpenPay = (poId?: string, defaultAmt?: number, defaultCurr?: string) => {
    setSelectedPoId(poId || '')
    setPaymentForm({
      amount: defaultAmt ? String(defaultAmt) : (summary?.balanceDueUSD ? String(summary.balanceDueUSD) : ''),
      currency: defaultCurr || supplier?.currency || 'USD',
      paymentMethod: 'Bank Transfer',
      paymentDate: new Date().toISOString().split('T')[0],
      reference: '',
      notes: poId ? `Payment for PO ${poId}` : '',
    })
    setPaymentDialogOpen(true)
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid positive payment amount')
      return
    }
    recordPaymentMutation.mutate({
      ...paymentForm,
      purchaseOrderId: selectedPoId || undefined,
      amount: parseFloat(paymentForm.amount),
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 border-4 border-gray-200 border-t-[#1a3a5c] rounded-full animate-spin text-[#1a3a5c]" />
        <span className="text-sm font-medium text-gray-500 mt-4">Loading supplier accounting statement...</span>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="space-y-6 py-8 max-w-7xl mx-auto px-4 text-center">
        <Building2 className="w-16 h-16 mx-auto text-gray-300" />
        <h2 className="text-xl font-bold text-gray-800">Supplier Not Found</h2>
        <p className="text-sm text-gray-500">The requested supplier statement could not be located.</p>
        <Link href="/admin/suppliers">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Suppliers
          </Button>
        </Link>
      </div>
    )
  }

  const localized = localizeSupplier(supplier, locale)
  const netBal = summary?.balanceDueUSD || 0
  const isSettled = Math.abs(netBal) <= 0.01
  const isCredit = netBal < -0.01
  const isDue = netBal > 0.01

  // Filtered POs
  const filteredOrders = (statement?.orders || []).filter((po: any) => {
    const isPaid = po.isPaid || (po.total > 0 && po.paid >= po.total)
    if (poFilter === 'UNPAID' && isPaid) return false
    if (poFilter === 'PAID' && !isPaid) return false
    return true
  })

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
              <span>{localized.name || supplier.name}</span>
              <Badge
                className={`text-xs font-bold uppercase tracking-wider ${
                  isSettled
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : isCredit
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}
              >
                {isSettled ? 'Account Settled' : isCredit ? 'Credit Available' : 'Balance Outstanding'}
              </Badge>
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Comprehensive Financial Statement, Purchase Orders Ledger & Disbursement History
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9 px-3 gap-1.5 text-xs text-gray-600 border-gray-300 hover:bg-gray-100"
            title="Reload statement data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-9 px-3 gap-1.5 text-xs text-gray-700 border-gray-300 hover:bg-gray-100"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-gray-600" />
            <span>Print Statement</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={handleExportExcel}
            className="h-9 px-3.5 gap-1.5 text-xs font-semibold text-emerald-800 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 transition-colors"
            title="Export complete accounting workbook to Microsoft Excel (.xlsx)"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Export to Excel</span>
          </Button>

          <Link href={`/admin/purchase-orders/new?supplierId=${supplier.id}`}>
            <Button variant="outline" size="sm" className="h-9 px-3.5 gap-1.5 text-xs font-semibold text-[#1a3a5c] border-[#1a3a5c]/30 hover:bg-[#1a3a5c]/10">
              <Plus className="w-4 h-4" />
              <span>Create Purchase Order</span>
            </Button>
          </Link>

          <Button
            onClick={() => handleOpenPay()}
            className="h-9 px-4 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
          >
            <CreditCard className="w-4 h-4" />
            <span>Record Payment</span>
          </Button>

          <Link href="/admin/suppliers">
            <Button variant="outline" size="sm" className="h-9 px-3.5 gap-1.5 text-xs font-semibold text-gray-700 border-gray-300 hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Suppliers</span>
            </Button>
          </Link>
        </div>
      </div>


      {/* Print Only Header */}
      <div className="hidden print:block border-b border-gray-300 pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SUPPLIER ACCOUNTING STATEMENT</h1>
            <p className="text-xs text-gray-600">Generated on: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold text-gray-800">{supplier.companyName || supplier.name}</h2>
            <p className="text-xs text-gray-600">Terms: {supplier.paymentTerms || 'Standard'} ({supplier.currency || 'USD'})</p>
          </div>
        </div>
      </div>
      {/* Supplier Profile Header Card - High density modern UI */}
      <Card className="border-gray-200/90 shadow-sm bg-gradient-to-br from-white via-slate-50/40 to-slate-100/30 overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Legal Entity & Contact Person */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Company & Legal Name
                </span>
                <div className="font-extrabold text-slate-900 text-sm flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="leading-snug">{supplier.companyName || supplier.name}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="text-slate-400 text-[11px]">Contact Person:</span>
                <span className="font-semibold text-slate-800">{supplier.contactPerson || '—'}</span>
              </div>
            </div>

            {/* 2. Direct Channels (Email & Phone) */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Contact Details
                </span>
                <div className="space-y-2 text-xs">
                  {supplier.email ? (
                    <a
                      href={`mailto:${supplier.email}`}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline font-medium break-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span>{supplier.email}</span>
                    </a>
                  ) : (
                    <div className="text-slate-400 italic text-[11px]">No email registered</div>
                  )}

                  {supplier.phone ? (
                    <a
                      href={`tel:${supplier.phone}`}
                      className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-mono font-bold tracking-tight"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{supplier.phone}</span>
                    </a>
                  ) : (
                    <div className="text-slate-400 italic text-[11px]">No phone registered</div>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Direct Channel:</span>
                <span className="font-medium text-slate-700">Verified Partner</span>
              </div>
            </div>

            {/* 3. Address & Tax Registration */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Address & Tax ID
                </span>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <span className="leading-snug">{supplier.address || 'Address not specified'}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Tax ID / License:</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                  {supplier.taxId || 'N/A'}
                </span>
              </div>
            </div>

            {/* 4. Payment Terms, Currency & Notes */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Payment Terms & Currency
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900 uppercase">
                    {supplier.paymentTerms || 'Standard'}
                  </span>
                  <Badge variant="outline" className="font-mono font-bold text-[10px] bg-slate-50 text-slate-800 border-slate-300">
                    {supplier.currency || 'USD'}
                  </Badge>
                </div>
              </div>
              {supplier.notes ? (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] text-slate-600 italic line-clamp-2 leading-relaxed" title={supplier.notes}>
                    &ldquo;{supplier.notes}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 italic">
                  No internal remarks
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <Card className="border border-gray-200/90 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Purchase Orders
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-gray-900">{summary?.totalOrders ?? 0}</div>
            <p className="text-xs text-gray-500 mt-1">{statement?.payments?.length ?? 0} payment disbursements</p>
          </CardContent>
        </Card>

        {/* Total Invoiced Volume */}
        <Card className="border border-blue-200/90 shadow-xs bg-blue-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-900">
              Total Invoiced (USD)
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-blue-950 font-mono">
              ${(summary?.totalPurchasedUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-blue-800/80 mt-1">Cumulative PO volume</p>
          </CardContent>
        </Card>

        {/* Total Paid Volume */}
        <Card className="border border-emerald-200/90 shadow-xs bg-emerald-50/20">
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
              ${(summary?.totalPaidUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-800/80 mt-1">Total cleared disbursements</p>
          </CardContent>
        </Card>

        {/* Net Outstanding Balance Due / Net Credit Available */}
        <Card
          className={`border shadow-xs ${
            isDue
              ? 'border-amber-200/90 bg-amber-50/25'
              : isCredit
              ? 'border-blue-200/90 bg-blue-50/25'
              : 'border-emerald-200/90 bg-emerald-50/20'
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              className={`text-xs font-semibold uppercase tracking-wider ${
                isDue ? 'text-amber-900' : isCredit ? 'text-blue-900' : 'text-emerald-900'
              }`}
            >
              {isCredit ? 'Credit Available (USD)' : 'Balance Due (USD)'}
            </CardTitle>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDue ? 'bg-amber-100 text-amber-700' : isCredit ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isDue ? (
                <TrendingUp className="w-4 h-4 text-amber-700" />
              ) : isCredit ? (
                <Coins className="w-4 h-4 text-blue-700" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-extrabold font-mono ${
                isDue ? 'text-amber-800' : isCredit ? 'text-blue-800' : 'text-emerald-700'
              }`}
            >
              {isCredit ? '-' : ''}${Math.abs(summary?.balanceDueUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p
              className={`text-xs mt-1 ${
                isDue ? 'text-amber-800/80 font-medium' : isCredit ? 'text-blue-800/80 font-medium' : 'text-emerald-800/80'
              }`}
            >
              {isDue ? 'Unsettled account liability' : isCredit ? 'Credit on account with supplier' : 'All PO orders fully settled'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Currency Ledger Breakdown Card */}
      {summary?.currencyLedgerSummary && summary.currencyLedgerSummary.length > 0 && (
        <Card className="border-slate-200 shadow-xs bg-slate-50/60">
          <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-200/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-600" />
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Multi-Currency Ledger Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Exact vendor balances grouped by currency. Disburse total account-level payments directly.
                  </CardDescription>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {summary.currencyLedgerSummary.length} transaction currency(ies) detected
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.currencyLedgerSummary.map((item: any) => {
                const isZero = Math.abs(item.balanceDue || 0) <= 0.01
                const isCredit = (item.balanceDue || 0) < -0.01
                const isDue = (item.balanceDue || 0) > 0.01
                return (
                  <div
                    key={item.currency}
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-extrabold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded font-mono">
                          {item.currency} Ledger
                        </span>
                        <Badge
                          variant={isZero ? 'outline' : 'default'}
                          className={`text-[11px] font-bold ${
                            isZero
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isCredit
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isZero ? 'Settled ($0.00)' : isCredit ? 'Account Credit' : 'Pending Due'}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 text-xs pt-2">
                        <div className="flex justify-between text-slate-600 py-0.5">
                          <span>Total Invoiced:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {item.currency} {item.totalPurchased.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600 py-0.5">
                          <span>Total Paid / Settled:</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {item.currency} {item.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm">
                          <span className="text-slate-800">
                            {isCredit ? 'Credit Available:' : 'Net Balance Due:'}
                          </span>
                          <span className={`font-mono font-extrabold ${
                            isZero ? 'text-emerald-600' : isCredit ? 'text-blue-700' : 'text-amber-800'
                          }`}>
                            {item.currency} {Math.abs(item.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 print:hidden">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleOpenPay('', isDue ? item.balanceDue : undefined, item.currency)}
                        className={`w-full text-xs font-semibold h-8 gap-1.5 ${
                          isDue
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay {item.currency} Account</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs / Filter Controls for Orders & Payments */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 print:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('ALL')}
            className={`h-9 px-3.5 text-xs font-semibold ${activeTab === 'ALL' ? 'bg-[#1a3a5c]' : ''}`}
          >
            All Ledger Records
          </Button>
          <Button
            variant={activeTab === 'ORDERS' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('ORDERS')}
            className={`h-9 px-3.5 text-xs font-semibold ${activeTab === 'ORDERS' ? 'bg-[#1a3a5c]' : ''}`}
          >
            Purchase Orders ({statement?.orders?.length || 0})
          </Button>
          <Button
            variant={activeTab === 'PAYMENTS' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('PAYMENTS')}
            className={`h-9 px-3.5 text-xs font-semibold ${activeTab === 'PAYMENTS' ? 'bg-[#1a3a5c]' : ''}`}
          >
            Payments ({statement?.payments?.length || 0})
          </Button>
        </div>


      </div>

      {/* Section 1: Purchase Orders Ledger Table */}
      {(activeTab === 'ALL' || activeTab === 'ORDERS') && (
        <Card className="border-gray-200 shadow-xs overflow-hidden">
          <CardHeader className="bg-gray-50/70 border-b border-gray-200/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Purchase Orders & Invoices</span>
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Purchased orders, invoiced order amounts and commitments for this supplier
                </CardDescription>
              </div>
              <Link href={`/admin/purchase-orders/new?supplierId=${supplier.id}`}>
                <Button size="sm" variant="outline" className="h-8 text-xs font-semibold gap-1 text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add PO</span>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-gray-700">No purchase orders found matching current filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                      <TableHead className="py-3.5 px-4">PO Number</TableHead>
                      <TableHead className="py-3.5 px-4">Order Date</TableHead>
                      <TableHead className="py-3.5 px-4">Order Status</TableHead>
                      <TableHead className="py-3.5 px-4 text-center">Items</TableHead>
                      <TableHead className="py-3.5 px-4 text-right">Order Total (Invoiced)</TableHead>
                      <TableHead className="py-3.5 px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 text-xs">
                    {filteredOrders.map((po: any) => {
                      return (
                        <TableRow key={po.id} className="hover:bg-gray-50/70 transition-colors">
                          <TableCell className="py-3.5 px-4 font-mono font-bold text-gray-900">
                            <Link href={`/admin/purchase-orders/${po.id}/edit`} className="text-[#1a3a5c] hover:underline flex items-center gap-1">
                              <span>{po.poNumber}</span>
                              <ExternalLink className="w-3 h-3 text-gray-400" />
                            </Link>
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                            {new Date(po.orderDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                              {po.status}
                            </span>
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-center font-semibold text-gray-600">
                            {po.itemsCount || 0} items
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                            {po.currency} {po.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={`/admin/purchase-orders/${po.id}/edit`}>
                                <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs text-[#1a3a5c] border-gray-200 hover:bg-gray-100 gap-1 font-semibold" title="View / Edit Purchase Order">
                                  <span>View PO</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  {statement?.orders && statement.orders.length > 0 && (() => {
                    const totalsByCurr: Record<string, number> = {}
                    statement.orders.forEach((o: any) => {
                      const c = (o.currency || 'USD').toUpperCase()
                      totalsByCurr[c] = (totalsByCurr[c] || 0) + (o.total || 0)
                    })
                    const entries = Object.entries(totalsByCurr)
                    const balEntries = Object.entries(summary?.balanceByCurrency || {}).filter(([_, v]) => Math.abs(Number(v)) > 0.01)

                    return (
                      <tfoot className="bg-slate-50/95 border-t-2 border-slate-300 font-semibold text-xs">
                        {/* Invoiced Totals */}
                        {entries.map(([curr, totalAmt], idx) => (
                          <TableRow key={curr} className="hover:bg-slate-100/60 border-b border-slate-200/60">
                            <TableCell colSpan={4} className="py-2.5 px-4 text-slate-700">
                              {idx === 0 ? (
                                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-800">
                                  Total Invoiced Orders ({statement.orders.length} POs):
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">Invoiced Subtotal:</span>
                              )}
                            </TableCell>
                            <TableCell className="py-2.5 px-4 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                              <span className="bg-blue-100/80 text-blue-950 px-2 py-0.5 rounded border border-blue-200/80">
                                {curr} {totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5 px-4" />
                          </TableRow>
                        ))}

                        {/* Net Remaining Balance by Currency */}
                        {balEntries.length > 0 && (
                          <TableRow className="bg-amber-50/60 border-t border-amber-200/80">
                            <TableCell colSpan={4} className="py-2.5 px-4 text-amber-950">
                              <span className="font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Net Balance Due (By Currency):
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5 px-4 text-right whitespace-nowrap">
                              <div className="flex flex-wrap items-center justify-end gap-1">
                                {balEntries.map(([c, b]) => {
                                  const balNum = Number(b)
                                  const isDue = balNum > 0.01
                                  return (
                                    <span
                                      key={c}
                                      className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded border ${
                                        isDue ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-blue-100 text-blue-900 border-blue-300'
                                      }`}
                                    >
                                      {c} {Math.abs(balNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {isDue ? 'Due' : 'Credit'}
                                    </span>
                                  )
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="py-2.5 px-4" />
                          </TableRow>
                        )}
                      </tfoot>
                    )
                  })()}
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 2: Recorded Supplier Payments History */}
      {(activeTab === 'ALL' || activeTab === 'PAYMENTS') && (
        <Card className="border-gray-200 shadow-xs overflow-hidden">
          <CardHeader className="bg-gray-50/70 border-b border-gray-200/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Recorded Supplier Payments History</span>
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Full chronological audit log of disbursements made to this supplier
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => handleOpenPay()}
                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(!statement?.payments || statement.payments.length === 0) ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                <CreditCard className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-gray-700">No payment disbursements recorded for this supplier.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                      <TableHead className="py-3 px-4">Date</TableHead>
                      <TableHead className="py-3 px-4">PO Linked</TableHead>
                      <TableHead className="py-3 px-4">Payment Method</TableHead>
                      <TableHead className="py-3 px-4">Transfer Reference #</TableHead>
                      <TableHead className="py-3 px-4">Notes / Description</TableHead>
                      <TableHead className="py-3 px-4 text-right">Amount Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 text-xs">
                    {statement.payments.map((p: any) => (
                      <TableRow key={p.id} className="hover:bg-gray-50/50">
                        <TableCell className="py-3 px-4 text-gray-600 whitespace-nowrap">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-3 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                          {p.poNumber ? (
                            <Link href={`/admin/purchase-orders/${p.purchaseOrderId}/edit`} className="text-[#1a3a5c] hover:underline">
                              {p.poNumber} {p.poCurrency ? `(${p.poCurrency})` : ''}
                            </Link>
                          ) : (
                            <span className="text-gray-400 italic">Direct Account</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-gray-700 font-medium">
                          {p.paymentMethod || 'Bank Transfer'}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-gray-600 font-mono">
                          {p.reference || '—'}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-gray-500 italic max-w-xs truncate">
                          {p.notes || '—'}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700 whitespace-nowrap text-sm">
                          {p.currency} {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {statement?.payments && statement.payments.length > 0 && (() => {
                    const totalsByCurr: Record<string, number> = {}
                    statement.payments.forEach((p: any) => {
                      const c = (p.currency || 'USD').toUpperCase()
                      totalsByCurr[c] = (totalsByCurr[c] || 0) + (p.amount || 0)
                    })
                    const entries = Object.entries(totalsByCurr)
                    const balEntries = Object.entries(summary?.balanceByCurrency || {}).filter(([_, v]) => Math.abs(Number(v)) > 0.01)

                    return (
                      <tfoot className="bg-slate-50/95 border-t-2 border-slate-300 font-semibold text-xs">
                        {/* Paid Totals */}
                        {entries.map(([curr, totalAmt], idx) => (
                          <TableRow key={curr} className="hover:bg-slate-100/60 border-b border-slate-200/60">
                            <TableCell colSpan={5} className="py-2.5 px-4 text-slate-700">
                              {idx === 0 ? (
                                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-800">
                                  Total Disbursements Paid ({statement.payments.length} Payments):
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">Disbursed Subtotal:</span>
                              )}
                            </TableCell>
                            <TableCell className="py-2.5 px-4 text-right font-mono font-extrabold text-emerald-700 whitespace-nowrap">
                              <span className="bg-emerald-100/80 text-emerald-950 px-2 py-0.5 rounded border border-emerald-200/80">
                                {curr} {totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Net Remaining Balance by Currency */}
                        {balEntries.length > 0 && (
                          <TableRow className="bg-amber-50/60 border-t border-amber-200/80">
                            <TableCell colSpan={5} className="py-2.5 px-4 text-amber-950">
                              <span className="font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Net Remaining Balance Due:
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5 px-4 text-right whitespace-nowrap">
                              <div className="flex flex-wrap items-center justify-end gap-1">
                                {balEntries.map(([c, b]) => {
                                  const balNum = Number(b)
                                  const isDue = balNum > 0.01
                                  return (
                                    <span
                                      key={c}
                                      className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded border ${
                                        isDue ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-blue-100 text-blue-900 border-blue-300'
                                      }`}
                                    >
                                      {c} {Math.abs(balNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {isDue ? 'Due' : 'Credit'}
                                    </span>
                                  )
                                })}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </tfoot>
                    )
                  })()}
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>Record Payment to {supplier.name}</span>
            </DialogTitle>
            <DialogDescription>
              Disburse payment to supplier account or settle specific purchase orders directly.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
            {/* Target PO selection */}
            <div>
              <Label htmlFor="targetPo" className="text-xs font-semibold">Settlement Scope (Account-Level or Single PO)</Label>
              <select
                id="targetPo"
                value={selectedPoId}
                onChange={(e) => {
                  const id = e.target.value
                  setSelectedPoId(id)
                  if (id) {
                    const found = (statement?.orders || []).find((o: any) => o.id === id)
                    if (found) {
                      setPaymentForm((prev) => ({
                        ...prev,
                        currency: found.currency,
                        amount: found.balance > 0 ? String(found.balance) : prev.amount,
                      }))
                    }
                  }
                }}
                className="w-full h-10 px-3 rounded-md border border-gray-300 text-xs bg-white font-medium"
              >
                <option value="">Account-Level Payment (Multi-Invoice FIFO Settlement)</option>
                {(statement?.orders || []).map((o: any) => (
                  <option key={o.id} value={o.id}>
                    Single PO: {o.poNumber} — Total: {o.currency} {o.total.toLocaleString()} (Due: {o.currency} {o.balance.toLocaleString()})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                Choose Account-Level Payment to settle multiple open invoices in one disbursement, or pick a single PO.
              </p>
            </div>

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
                placeholder="Optional notes or remittance remarks"
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
    </div>
  )
}
