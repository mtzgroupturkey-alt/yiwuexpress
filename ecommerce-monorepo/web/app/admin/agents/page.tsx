'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Trash2,
  Users,
  Loader2,
  Phone,
  Mail,
  Building,
  CreditCard,
  Receipt,
  Package,
  Search,
  ArrowUpDown,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Pencil,
  FileText,
  Filter,
  ExternalLink,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminLocale } from '../contexts/AdminLocaleContext'

interface AgentSummary {
  totalAgents: number
  activeAgents: number
  totalExpensesUSD: number
  totalPaidUSD: number
  totalBalanceUSD: number
  unpaidAgentsCount: number
}

interface Agent {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  isActive: boolean
  totalExpensesUSD: number
  totalPaidUSD: number
  balanceUSD: number
  expensesByCurrency: Record<string, number>
  paidByCurrency: Record<string, number>
  createdAt: string
  containers: any[]
  payments: any[]
  costItems: any[]
  _count: {
    containers: number
    payments: number
    costItems: number
  }
}

export default function AgentsPage() {
  const { dict } = useAdminLocale()
  const queryClient = useQueryClient()

  // State: Filter & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'DUE' | 'SETTLED' | 'ADVANCE'>('ALL')

  // State: Create / Edit Agent Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    isActive: true,
  })

  // State: Direct Payment Dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedAgentForPay, setSelectedAgentForPay] = useState<Agent | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    agentId: '',
    containerId: '',
    amount: '',
    currency: 'USD',
    paymentMethod: 'Bank Transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    notes: '',
  })

  // State: Financial Statement & Ledger Modal
  const [statementModalOpen, setStatementModalOpen] = useState(false)
  const [selectedAgentForStatement, setSelectedAgentForStatement] = useState<Agent | null>(null)
  const [statementTab, setStatementTab] = useState<'ALL' | 'EXPENSES' | 'PAYMENTS'>('ALL')

  // 1. Fetch Agents with Multi-Currency Accounting
  const { data: agentsResponse, isLoading: agentsLoading, refetch: refetchAgents } = useQuery<{
    success: boolean
    summary: AgentSummary
    data: Agent[]
  }>({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/admin/agents')
      if (!res.ok) throw new Error('Failed to fetch agents')
      return res.json()
    },
  })

  // 2. Fetch Containers for Payment selection
  const { data: containersResponse } = useQuery<{
    success: boolean
    data: any[]
  }>({
    queryKey: ['containers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/containers')
      if (!res.ok) throw new Error('Failed to fetch containers')
      return res.json()
    },
  })

  // 3. Fetch Active Currencies for live conversion preview
  const { data: currenciesData } = useQuery<{
    success: boolean
    data: { code: string; exchangeRate: number; symbol: string }[]
  }>({
    queryKey: ['admin-currencies'],
    queryFn: async () => {
      const res = await fetch('/api/admin/currencies')
      if (!res.ok) return { success: true, data: [] }
      return res.json()
    },
  })

  // 4. Fetch Detailed Statement when modal is opened
  const { data: statementResponse, isLoading: statementLoading } = useQuery({
    queryKey: ['agent-statement', selectedAgentForStatement?.id],
    queryFn: async () => {
      if (!selectedAgentForStatement?.id) return null
      const res = await fetch(`/api/admin/agents/${selectedAgentForStatement.id}/statement`)
      if (!res.ok) throw new Error('Failed to fetch agent statement')
      return res.json()
    },
    enabled: !!selectedAgentForStatement && statementModalOpen,
  })

  const agents = agentsResponse?.data || []
  const summary = agentsResponse?.summary || {
    totalAgents: 0,
    activeAgents: 0,
    totalExpensesUSD: 0,
    totalPaidUSD: 0,
    totalBalanceUSD: 0,
    unpaidAgentsCount: 0,
  }

  const containers = containersResponse?.data || []
  const currencies = currenciesData?.data || []

  // Exchange rate map helper
  const currencyRateMap = useMemo(() => {
    const map: Record<string, number> = { USD: 1 }
    currencies.forEach((c) => {
      if (c.code) map[c.code.toUpperCase()] = c.exchangeRate || 1
    })
    if (map['CNY'] && !map['RMB']) map['RMB'] = map['CNY']
    if (map['RMB'] && !map['CNY']) map['CNY'] = map['RMB']
    return map
  }, [currencies])

  // Computed converted USD preview for payment modal
  const paymentUsdPreview = useMemo(() => {
    const amt = parseFloat(paymentForm.amount) || 0
    const curr = paymentForm.currency.toUpperCase()
    if (curr === 'USD') return amt
    const rate = currencyRateMap[curr] || 1
    return Math.round((amt / rate) * 100) / 100
  }, [paymentForm.amount, paymentForm.currency, currencyRateMap])

  // Save Agent Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = editingAgent ? `/api/admin/agents/${editingAgent.id}` : '/api/admin/agents'
      const method = editingAgent ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save agent')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success(editingAgent ? 'Agent updated successfully' : 'Agent created successfully')
      setDialogOpen(false)
      setEditingAgent(null)
      setFormData({ name: '', email: '', phone: '', company: '', isActive: true })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error saving agent')
    },
  })

  // Delete Agent Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/agents/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete agent')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent deleted')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error deleting agent')
    },
  })

  // Record Payment Mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/admin/agents/${payload.agentId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to record payment')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      if (selectedAgentForStatement) {
        queryClient.invalidateQueries({ queryKey: ['agent-statement', selectedAgentForStatement.id] })
      }
      toast.success('Payment recorded successfully')
      setPaymentDialogOpen(false)
      setPaymentForm({
        agentId: '',
        containerId: '',
        amount: '',
        currency: 'USD',
        paymentMethod: 'Bank Transfer',
        paymentDate: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        notes: '',
      })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error recording payment')
    },
  })

  // Delete/Void Payment Mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await fetch(`/api/admin/agents/payments/${paymentId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to void payment')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      if (selectedAgentForStatement) {
        queryClient.invalidateQueries({ queryKey: ['agent-statement', selectedAgentForStatement.id] })
      }
      toast.success('Payment record removed')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error voiding payment')
    },
  })

  // Handlers
  const handleOpenCreate = () => {
    setEditingAgent(null)
    setFormData({ name: '', email: '', phone: '', company: '', isActive: true })
    setDialogOpen(true)
  }

  const handleOpenEdit = (agent: Agent) => {
    setEditingAgent(agent)
    setFormData({
      name: agent.name,
      email: agent.email || '',
      phone: agent.phone || '',
      company: agent.company || '',
      isActive: agent.isActive,
    })
    setDialogOpen(true)
  }

  const handleOpenPay = (agent?: Agent) => {
    const targetAgent = agent || agents[0]
    setSelectedAgentForPay(targetAgent || null)
    const suggestedAmount = targetAgent && targetAgent.balanceUSD > 0 ? String(targetAgent.balanceUSD) : ''
    setPaymentForm({
      agentId: targetAgent ? targetAgent.id : '',
      containerId: '', // Default: no container needed, direct agent account payment
      amount: suggestedAmount,
      currency: 'USD',
      paymentMethod: 'Bank Transfer',
      paymentDate: new Date().toISOString().split('T')[0],
      reference: '',
      description: targetAgent ? `Direct account payment to ${targetAgent.name}` : '',
      notes: '',
    })
    setPaymentDialogOpen(true)
  }

  const handleOpenStatement = (agent: Agent) => {
    setSelectedAgentForStatement(agent)
    setStatementTab('ALL')
    setStatementModalOpen(true)
  }

  const handleAgentFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Agent name is required')
      return
    }
    saveMutation.mutate(formData)
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentForm.agentId) {
      toast.error('Please select an agent')
      return
    }
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }
    recordPaymentMutation.mutate({
      ...paymentForm,
      containerId: paymentForm.containerId || null,
      amount: parseFloat(paymentForm.amount),
    })
  }

  // Filtered Agents List
  const filteredAgents = useMemo(() => {
    return agents.filter((ag) => {
      // Search
      const query = searchQuery.toLowerCase().trim()
      if (query) {
        const matchesName = ag.name.toLowerCase().includes(query)
        const matchesCompany = (ag.company || '').toLowerCase().includes(query)
        const matchesPhone = (ag.phone || '').toLowerCase().includes(query)
        const matchesEmail = (ag.email || '').toLowerCase().includes(query)
        if (!matchesName && !matchesCompany && !matchesPhone && !matchesEmail) return false
      }

      // Status
      if (statusFilter === 'ACTIVE' && !ag.isActive) return false
      if (statusFilter === 'INACTIVE' && ag.isActive) return false

      // Balance
      if (balanceFilter === 'DUE' && ag.balanceUSD <= 0) return false
      if (balanceFilter === 'SETTLED' && ag.balanceUSD !== 0) return false
      if (balanceFilter === 'ADVANCE' && ag.balanceUSD >= 0) return false

      return true
    })
  }, [agents, searchQuery, statusFilter, balanceFilter])

  // Statement Data Helpers
  const statement = statementResponse?.data
  const statementLedger = useMemo(() => {
    if (!statement) return []
    if (statementTab === 'EXPENSES') return statement.expenses || []
    if (statementTab === 'PAYMENTS') return statement.payments || []
    return statement.ledger || []
  }, [statement, statementTab])

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Shipping Agents & Accounting
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor forwarding agents, multi-currency container expenses, real-time balances, and disburse payouts directly.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchAgents()}
            className="h-9 px-3 gap-1.5 text-xs text-slate-600 border-slate-300 hover:bg-slate-100"
            title="Refresh accounting records"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => handleOpenPay()}
            className="h-9 px-3.5 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
          >
            <CreditCard className="w-4 h-4" />
            <span>Record Payment</span>
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="h-9 px-3.5 gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Shipping Agent</span>
          </Button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Forwarders */}
        <Card className="border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Forwarding Agents
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">{summary.totalAgents}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>{summary.activeAgents} active forwarders</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Total Incurred Expenses */}
        <Card className="border border-amber-200/80 shadow-xs hover:shadow-sm transition-shadow bg-amber-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-900">
              Total Incurred Costs
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-amber-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-900 font-mono">
              $${summary.totalExpensesUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-amber-800/80 mt-1">Billed freight, customs & terminal handling</p>
          </CardContent>
        </Card>

        {/* 3. Total Disbursed Payments */}
        <Card className="border border-emerald-200/80 shadow-xs hover:shadow-sm transition-shadow bg-emerald-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
              Total Paid to Date
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono">
              $${summary.totalPaidUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-800/80 mt-1">Disbursed disbursements & advance transfers</p>
          </CardContent>
        </Card>

        {/* 4. Net Outstanding Balance */}
        <Card
          className={`border shadow-xs hover:shadow-sm transition-shadow ${
            summary.totalBalanceUSD > 0
              ? 'border-rose-200/90 bg-rose-50/20'
              : 'border-blue-200/90 bg-blue-50/20'
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              className={`text-xs font-semibold uppercase tracking-wider ${
                summary.totalBalanceUSD > 0 ? 'text-rose-900' : 'text-blue-900'
              }`}
            >
              Net Payable Balance
            </CardTitle>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                summary.totalBalanceUSD > 0 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {summary.totalBalanceUSD > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-extrabold font-mono ${
                summary.totalBalanceUSD > 0 ? 'text-rose-700' : 'text-blue-700'
              }`}
            >
              $${summary.totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p
              className={`text-xs mt-1 ${
                summary.totalBalanceUSD > 0 ? 'text-rose-800/80 font-medium' : 'text-blue-800/80'
              }`}
            >
              {summary.totalBalanceUSD > 0
                ? `${summary.unpaidAgentsCount} agent(s) with pending balance`
                : 'All agent accounts fully settled or prepaid'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Control Bar */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search agent name, forwarding agency, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs border-slate-300 focus:border-primary"
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                onValueChange={(val: any) => setStatusFilter(val)}
              >
                <SelectTrigger className="h-10 text-xs border-slate-300">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active Forwarders Only</SelectItem>
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
                <SelectTrigger className="h-10 text-xs border-slate-300">
                  <SelectValue placeholder="Balance Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Balances</SelectItem>
                  <SelectItem value="DUE">Payable / Due (&gt; $0)</SelectItem>
                  <SelectItem value="SETTLED">Settled ($0.00)</SelectItem>
                  <SelectItem value="ADVANCE">Prepaid / Credit (&lt; $0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Agents Accounting Table */}
      <Card className="border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center text-slate-400">#</th>
                <th className="py-3 px-3 min-w-[150px]">Agent / Forwarder</th>
                <th className="py-3 px-3 min-w-[140px]">Agency / Company</th>
                <th className="py-3 px-3 min-w-[150px]">Contact Info</th>
                <th className="py-3 px-3 min-w-[120px]">Containers</th>
                <th className="py-3 px-3 min-w-[130px] text-right">Billed Costs</th>
                <th className="py-3 px-3 min-w-[130px] text-right">Total Paid</th>
                <th className="py-3 px-3 min-w-[135px] text-right">Outstanding Balance</th>
                <th className="py-3 px-3 min-w-[90px] text-center">Status</th>
                {/* Sticky Right Action Column */}
                <th className="py-3 px-3 min-w-[160px] text-center sticky right-0 z-20 bg-slate-100/95 backdrop-blur-sm border-l border-slate-200/90 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agentsLoading ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto text-primary" />
                    <span className="text-xs text-slate-500 mt-2.5 block">Loading agent accounting ledger...</span>
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-500">
                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No forwarders match your filter criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing search filters or add a new shipping agent.</p>
                  </td>
                </tr>
              ) : (
                filteredAgents.map((ag, index) => {
                  const hasDue = ag.balanceUSD > 0
                  const isSettled = ag.balanceUSD === 0
                  const isAdvance = ag.balanceUSD < 0

                  return (
                    <tr key={ag.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* # Index */}
                      <td className="py-3 px-3 text-center text-[11px] font-mono font-medium text-slate-400">
                        {index + 1}
                      </td>

                      {/* Agent Name */}
                      <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenStatement(ag)}
                          className="flex items-center gap-2 hover:text-primary transition-colors text-left"
                          title="Open Agent Financial Statement"
                        >
                          <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-primary flex-shrink-0">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-slate-900 group-hover:underline">{ag.name}</span>
                        </button>
                      </td>

                      {/* Agency Company */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {ag.company ? (
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{ag.company}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Independent Agent</span>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="space-y-0.5 text-xs">
                          {ag.phone ? (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              <a href={`tel:${ag.phone}`} className="text-slate-700 hover:text-primary hover:underline font-mono">
                                {ag.phone}
                              </a>
                            </div>
                          ) : null}
                          {ag.email ? (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-blue-600 flex-shrink-0" />
                              <a href={`mailto:${ag.email}`} className="text-slate-500 hover:text-primary hover:underline">
                                {ag.email}
                              </a>
                            </div>
                          ) : null}
                          {!ag.phone && !ag.email && (
                            <span className="text-slate-400 italic text-[11px]">No contact details</span>
                          )}
                        </div>
                      </td>

                      {/* Containers Handled */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Link
                          href={`/admin/containers?agentId=${ag.id}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
                          title="View containers handled by this forwarder"
                        >
                          <Package className="w-3 h-3 text-sky-600" />
                          <span>{ag._count?.containers || 0} Containers</span>
                        </Link>
                      </td>

                      {/* Billed Costs */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800 text-xs">
                          $${ag.totalExpensesUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {/* Currency tags */}
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          {Object.entries(ag.expensesByCurrency || {}).map(([curr, amt]) => {
                            if (amt <= 0) return null
                            return (
                              <span
                                key={curr}
                                className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded"
                                title={`${amt.toLocaleString()} ${curr}`}
                              >
                                {amt >= 1000 ? `${(amt / 1000).toFixed(1)}k` : amt} {curr}
                              </span>
                            )
                          })}
                        </div>
                      </td>

                      {/* Total Paid */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenStatement(ag)}
                          className="text-emerald-700 hover:text-emerald-900 font-mono font-bold text-xs hover:underline flex items-center justify-end gap-1 w-full"
                          title="Click to view payment history"
                        >
                          <span>$${ag.totalPaidUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <CreditCard className="w-3 h-3 text-emerald-600" />
                        </button>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {ag._count?.payments || 0} payment(s)
                        </div>
                      </td>

                      {/* Net Balance (Payable / Settled / Credit) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {hasDue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            $${ag.balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Due
                          </span>
                        ) : isSettled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Settled ($0.00)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700">
                            +$${Math.abs(ag.balanceUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Credit
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {ag.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-slate-200 bg-slate-100 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Sticky Right Actions Column with frosted glass & left border */}
                      <td className="py-2 px-3 sticky right-0 z-10 bg-white/95 group-hover:bg-slate-50/95 backdrop-blur-sm border-l border-slate-200/90 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] transition-colors">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Pay Agent Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPay(ag)}
                            className="w-8 h-8 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                            title="Make Payment to Agent"
                            aria-label="Make Payment to Agent"
                          >
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                          </button>

                          {/* 2. Statement / Ledger Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenStatement(ag)}
                            className="w-8 h-8 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                            title="View Financial Statement & History"
                            aria-label="View Financial Statement & History"
                          >
                            <FileText className="w-4 h-4 text-blue-600" />
                          </button>

                          {/* 3. Edit Agent Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(ag)}
                            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                            title="Edit Agent Information"
                            aria-label="Edit Agent Information"
                          >
                            <Pencil className="w-4 h-4 text-slate-600" />
                          </button>

                          {/* 4. Delete Agent Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete agent "${ag.name}"? This action cannot be undone.`)) {
                                deleteMutation.mutate(ag.id)
                              }
                            }}
                            className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 hover:text-rose-700 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                            title="Delete Agent"
                            aria-label="Delete Agent"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Direct Payment Modal */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Disburse Payment to Shipping Agent
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record a payment voucher to settle agent fees and allocate disbursements to a container.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-1 text-xs">
            {/* 1. Agent Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="pay-agent" className="text-xs font-semibold text-slate-700">
                Forwarding Agent *
              </Label>
              <Select
                value={paymentForm.agentId}
                onValueChange={(val) => {
                  setPaymentForm({ ...paymentForm, agentId: val })
                  const chosen = agents.find((a) => a.id === val)
                  if (chosen && chosen.containers?.length) {
                    setPaymentForm((prev) => ({
                      ...prev,
                      agentId: val,
                      containerId: chosen.containers[0].id,
                    }))
                  }
                }}
              >
                <SelectTrigger id="pay-agent" className="h-9 text-xs border-slate-300">
                  <SelectValue placeholder="Select Forwarding Agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((ag) => (
                    <SelectItem key={ag.id} value={ag.id}>
                      {ag.name} {ag.company ? `(${ag.company})` : ''} — Balance:{' '}
                      {ag.balanceUSD > 0
                        ? `$${ag.balanceUSD} Due`
                        : ag.balanceUSD < 0
                        ? `+$${Math.abs(ag.balanceUSD)} Credit`
                        : 'Settled'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Agent Financial Summary Strip in Payment Dialog */}
            {(() => {
              const activeAgent = agents.find((a) => a.id === paymentForm.agentId)
              if (!activeAgent) return null
              return (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Total Costs Billed</span>
                      <span className="font-mono font-bold text-slate-800">
                        ${activeAgent.totalExpensesUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Total Paid to Date</span>
                      <span className="font-mono font-bold text-emerald-700">
                        ${activeAgent.totalPaidUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Outstanding Balance</span>
                      <span className={`font-mono font-bold ${activeAgent.balanceUSD > 0 ? 'text-rose-700' : 'text-blue-700'}`}>
                        ${activeAgent.balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        {activeAgent.balanceUSD > 0 ? ' Due' : ' Credit'}
                      </span>
                    </div>
                  </div>
                  {activeAgent.balanceUSD > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentForm(prev => ({ ...prev, amount: String(activeAgent.balanceUSD), currency: 'USD' }))}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 pt-1 border-t border-slate-200/80 w-full"
                    >
                      <CheckCircle2 className="w-3 h-3 text-blue-500" />
                      Auto-fill Outstanding Balance (${activeAgent.balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                    </button>
                  )}
                </div>
              )
            })()}

            {/* 2. Optional Container Association */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pay-container" className="text-xs font-semibold text-slate-700">
                  Associated Shipment (Optional)
                </Label>
                <span className="text-[10px] text-slate-400 font-medium">No container required — credits total balance</span>
              </div>
              <Select
                value={paymentForm.containerId || 'NONE'}
                onValueChange={(val) => setPaymentForm({ ...paymentForm, containerId: val === 'NONE' ? '' : val })}
              >
                <SelectTrigger id="pay-container" className="h-9 text-xs border-slate-300">
                  <SelectValue placeholder="None — Direct General Payment (All Shipments / Total Balance)" />
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  <SelectItem value="NONE">
                    <span className="font-medium text-slate-800">
                      None — Direct General Payment (All Shipments / Total Balance)
                    </span>
                  </SelectItem>
                  {containers.map((c) => {
                    const isAgentContainer = c.agentId === paymentForm.agentId
                    return (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{c.containerNumber}</span>
                          <span className="text-slate-500 text-[11px]">
                            ({c.origin} → {c.destination})
                          </span>
                          {isAgentContainer && (
                            <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">
                              Assigned
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Amount & Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pay-amount" className="text-xs font-semibold text-slate-700">
                  Payment Amount *
                </Label>
                <Input
                  id="pay-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="h-9 font-mono text-xs border-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-currency" className="text-xs font-semibold text-slate-700">
                  Currency *
                </Label>
                <Select
                  value={paymentForm.currency}
                  onValueChange={(val) => setPaymentForm({ ...paymentForm, currency: val })}
                >
                  <SelectTrigger id="pay-currency" className="h-9 text-xs border-slate-300 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($ - US Dollar)</SelectItem>
                    <SelectItem value="CNY">CNY / RMB (¥ - Chinese Yuan)</SelectItem>
                    <SelectItem value="EUR">EUR (€ - Euro)</SelectItem>
                    <SelectItem value="RUB">RUB (₽ - Russian Ruble)</SelectItem>
                    <SelectItem value="BYN">BYN (Br - Belarusian Ruble)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live USD conversion preview */}
            {paymentForm.currency !== 'USD' && paymentForm.amount && (
              <div className="p-2.5 rounded-md bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                <span>Converted Base Equivalent:</span>
                <span className="font-mono font-bold text-sm text-blue-700">
                  ≈ $${paymentUsdPreview.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
            )}

            {/* 4. Payment Method & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pay-method" className="text-xs font-semibold text-slate-700">
                  Payment Method
                </Label>
                <Select
                  value={paymentForm.paymentMethod}
                  onValueChange={(val) => setPaymentForm({ ...paymentForm, paymentMethod: val })}
                >
                  <SelectTrigger id="pay-method" className="h-9 text-xs border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer (T/T)</SelectItem>
                    <SelectItem value="WeChat Pay">WeChat Pay</SelectItem>
                    <SelectItem value="Alipay">Alipay</SelectItem>
                    <SelectItem value="Cash">Cash (RMB/USD)</SelectItem>
                    <SelectItem value="Wire Transfer">International Wire</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-date" className="text-xs font-semibold text-slate-700">
                  Payment Date
                </Label>
                <Input
                  id="pay-date"
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="h-9 text-xs border-slate-300"
                />
              </div>
            </div>

            {/* 5. Reference & Description */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pay-ref" className="text-xs font-semibold text-slate-700">
                  Reference / Receipt #
                </Label>
                <Input
                  id="pay-ref"
                  placeholder="e.g. TXN-998234, Bank Slip #..."
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="h-9 text-xs border-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-desc" className="text-xs font-semibold text-slate-700">
                  Payment Purpose / Description
                </Label>
                <Input
                  id="pay-desc"
                  placeholder="e.g. Terminal handling fee payment"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  className="h-9 text-xs border-slate-300"
                />
              </div>
            </div>

            {/* 6. Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="pay-notes" className="text-xs font-semibold text-slate-700">
                Additional Notes
              </Label>
              <Input
                id="pay-notes"
                placeholder="Optional internal remarks..."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="h-9 text-xs border-slate-300"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentDialogOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={recordPaymentMutation.isPending}
                className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {recordPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Recording...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Confirm & Disburse Payment
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Financial Statement & Ledger Modal */}
      <Dialog open={statementModalOpen} onOpenChange={setStatementModalOpen}>
        <DialogContent className="sm:max-w-[780px] max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Receipt className="w-5 h-5 text-primary" />
                  Financial Statement: {selectedAgentForStatement?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  {selectedAgentForStatement?.company && (
                    <span className="font-semibold text-slate-700">
                      {selectedAgentForStatement.company} •{' '}
                    </span>
                  )}
                  Complete audit trail of billed container expenses and payment disbursements.
                </DialogDescription>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  if (selectedAgentForStatement) {
                    handleOpenPay(selectedAgentForStatement)
                  }
                }}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 flex-shrink-0"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay Agent</span>
              </Button>
            </div>
          </DialogHeader>

          {/* Statement Balance Strip */}
          {statement && (
            <div className="grid grid-cols-3 gap-3 my-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                  Total Billed Expenses
                </span>
                <span className="font-mono font-bold text-base text-amber-900">
                  $${(statement.summary?.totalExpensesUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                  Total Paid Disbursements
                </span>
                <span className="font-mono font-bold text-base text-emerald-700">
                  $${(statement.summary?.totalPaidUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                  Net Outstanding Balance
                </span>
                <span
                  className={`font-mono font-extrabold text-base ${
                    (statement.summary?.balanceUSD || 0) > 0
                      ? 'text-rose-700'
                      : (statement.summary?.balanceUSD || 0) < 0
                      ? 'text-blue-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {(statement.summary?.balanceUSD || 0) > 0
                    ? `$${(statement.summary?.balanceUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} Due`
                    : (statement.summary?.balanceUSD || 0) < 0
                    ? `+$${Math.abs(statement.summary?.balanceUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} Credit`
                    : 'Settled ($0.00)'}
                </span>
              </div>
            </div>
          )}

          {/* Statement Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 pb-2 text-xs">
            <button
              type="button"
              onClick={() => setStatementTab('ALL')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                statementTab === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Transactions ({statement?.ledger?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setStatementTab('EXPENSES')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                statementTab === 'EXPENSES'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Billed Expenses ({statement?.expenses?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setStatementTab('PAYMENTS')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                statementTab === 'PAYMENTS'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Payments Made ({statement?.payments?.length || 0})
            </button>
          </div>

          {/* Statement Table Content */}
          <div className="flex-1 overflow-y-auto pt-2 text-xs">
            {statementLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                <span className="text-xs text-slate-500 mt-2 block">Loading financial ledger...</span>
              </div>
            ) : statementLedger.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No transactions recorded for this forwarder.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Container #</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Original Amount</th>
                    <th className="py-2.5 px-3 text-right">USD Base</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statementLedger.map((row: any) => {
                    const isPayment = row.type === 'PAYMENT'
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                          {new Date(row.date).toLocaleDateString()}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isPayment ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CreditCard className="w-2.5 h-2.5" />
                              PAYMENT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Receipt className="w-2.5 h-2.5" />
                              EXPENSE
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap font-mono font-semibold">
                          {row.container ? (
                            <Link
                              href={`/admin/containers/${row.container.id}`}
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <span>{row.container.containerNumber}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-slate-700">
                          <div className="font-medium">{row.title}</div>
                          {isPayment && (row.paymentMethod || row.reference) && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {row.paymentMethod} {row.reference ? `• Ref: ${row.reference}` : ''}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          <span className={isPayment ? 'text-emerald-700' : 'text-slate-800'}>
                            {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {row.currency}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          <span className={isPayment ? 'text-emerald-700' : 'text-amber-800'}>
                            {isPayment ? '-' : '+'}$${row.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {isPayment ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Void/Delete this payment record? Container expenses will be automatically resynced.')) {
                                  deletePaymentMutation.mutate(row.id)
                                }
                              }}
                              className="w-6 h-6 rounded flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 mx-auto transition-colors"
                              title="Void/Delete Payment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">Recorded</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Agent Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingAgent ? 'Edit Shipping Agent' : 'Add New Shipping Agent'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide contact info and company agency for forwarding operations
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAgentFormSubmit} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                Agent Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Chen Wei, Alex Morgan"
                required
                className="h-9 text-xs border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-xs font-semibold text-slate-700">
                Company / Forwarding Agency
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Sinotrans Logistics, Yiwu Freight Hub"
                className="h-9 text-xs border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                Phone / WhatsApp
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+86 138 0000 0000"
                className="h-9 text-xs border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="agent@logistics.com"
                className="h-9 text-xs border-slate-300"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isActive" className="cursor-pointer text-xs font-medium text-slate-700">
                Active for shipment assignments
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="h-9 text-xs font-semibold">
                {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                {editingAgent ? 'Save Changes' : 'Create Agent'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
