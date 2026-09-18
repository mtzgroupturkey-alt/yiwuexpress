'use client'

import { useState, useEffect, Suspense, Fragment } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
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
  Eye,
  Search,
  Package,
  Ship,
  Plane,
  Truck,
  Layers,
  Loader2,
  Trash2,
  Pencil,
  Edit,
  DollarSign,
  Receipt,
  UserCheck,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Boxes,
  FileText,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminLocale } from '../contexts/AdminLocaleContext'
import { COUNTRIES } from '@/lib/countries'
import { CountryCityPicker } from '@/components/admin/containers/CountryCityPicker'

const statusBadges: Record<string, { bg: string; text: string; dot: string }> = {
  PLANNING: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400' },
  LOADING: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  DEPARTED: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  IN_TRANSIT: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  AT_CUSTOMS: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
  ARRIVED: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', dot: 'bg-teal-500' },
  DELIVERED: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  CANCELLED: { bg: 'bg-zinc-100 border-zinc-300', text: 'text-zinc-600', dot: 'bg-zinc-400' },
}

const getRouteIcon = (type: string) => {
  switch (type) {
    case 'SEA':
      return <Ship className="w-4 h-4 text-blue-600" />
    case 'AIR':
      return <Plane className="w-4 h-4 text-sky-600" />
    case 'LAND':
      return <Truck className="w-4 h-4 text-amber-600" />
    default:
      return <Layers className="w-4 h-4 text-purple-600" />
  }
}

const getCurrencySymbol = (code?: string | null): string => {
  const c = (code || 'USD').toUpperCase()
  switch (c) {
    case 'CNY':
    case 'RMB':
      return '¥'
    case 'EUR':
      return '€'
    case 'RUB':
      return '₽'
    case 'GBP':
      return '£'
    case 'TRY':
      return '₺'
    case 'USD':
    default:
      return '$'
  }
}

function ContainersContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const urlAgentId = searchParams.get('agentId') || ''
  const { dict } = useAdminLocale()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [routeFilter, setRouteFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState(urlAgentId)

  // Sync state if URL search query changes
  useEffect(() => {
    const qAgent = searchParams.get('agentId') || ''
    setAgentFilter(qAgent)
  }, [searchParams])

  const handleAgentFilterChange = (newAgentId: string) => {
    const val = newAgentId === 'ALL' ? '' : newAgentId
    setAgentFilter(val)
    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set('agentId', val)
    } else {
      params.delete('agentId')
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    router.replace(`${pathname}${query}`, { scroll: false })
  }

  // Edit Container modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({
    id: '',
    containerNumber: '',
    carrierId: '',
    agentId: '',
    routeType: 'SEA',
    origin: '',
    destination: '',
    departureDate: '',
    arrivalDate: '',
    status: 'PLANNING',
    notes: '',
  })

  // Quick Add Cost modal state
  const [quickCostModalOpen, setQuickCostModalOpen] = useState(false)
  const [selectedContainer, setSelectedContainer] = useState<any>(null)
  const [costTitle, setCostTitle] = useState('')
  const [costAmount, setCostAmount] = useState('')
  const [costCurrency, setCostCurrency] = useState('USD')
  const [costIsPaid, setCostIsPaid] = useState(false)
  const [costNotes, setCostNotes] = useState('')
  const [costAgentId, setCostAgentId] = useState('')

  // Cargo Details Modal & Expanded Rows state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [cargoModalOpen, setCargoModalOpen] = useState(false)
  const [cargoModalContainer, setCargoModalContainer] = useState<any>(null)

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleOpenCargoModal = (container: any) => {
    setCargoModalContainer(container)
    setCargoModalOpen(true)
  }

  const { data, isLoading } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['containers', statusFilter, routeFilter, agentFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter)
      if (routeFilter && routeFilter !== 'ALL') params.append('routeType', routeFilter)
      if (agentFilter && agentFilter !== 'ALL') params.append('agentId', agentFilter)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(`/api/admin/containers?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch containers')
      return res.json()
    },
  })

  const { data: agentsData } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['agents'],
    queryFn: () => fetch('/api/admin/agents').then((r) => r.json()),
  })

  const containers = data?.data || []
  const { data: carriersData } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['carriers'],
    queryFn: () => fetch('/api/admin/carriers').then((r) => r.json()),
  })

  const carriers = carriersData?.data || []
  const agents = agentsData?.data || []

  // Stats calculation
  const totalContainers = containers.length
  const inTransitCount = containers.filter((c) => ['DEPARTED', 'IN_TRANSIT', 'AT_CUSTOMS'].includes(c.status)).length
  const deliveredCount = containers.filter((c) => c.status === 'DELIVERED').length
  const totalFreightValue = containers.reduce((sum, c) => sum + (c.totalCost || 0), 0)
  const totalCargoUnits = containers.reduce((sum, c) => sum + (c.items || []).reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0), 0)
  const totalCargoFobValue = containers.reduce((sum, c) => sum + (c.items || []).reduce((s: number, i: any) => s + (Number(i.totalCost) || ((Number(i.unitCost) || 0) * (Number(i.quantity) || 0))), 0), 0)

  const allExpanded = containers.length > 0 && containers.every((c: any) => expandedRows[c.id])
  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedRows({})
    } else {
      const next: Record<string, boolean> = {}
      containers.forEach((c: any) => {
        next[c.id] = true
      })
      setExpandedRows(next)
    }
  }

  // Quick Add Cost mutation
  const quickCostMutation = useMutation({
    mutationFn: async (payload: { containerId: string; title: string; amount: number; currency: string; isPaid: boolean; notes: string; agentId?: string | null }) => {
      const res = await fetch(`/api/admin/containers/${payload.containerId}/costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title,
          amount: payload.amount,
          currency: payload.currency,
          isPaid: payload.isPaid,
          notes: payload.notes,
          agentId: payload.agentId || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to add cost item')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      toast.success(dict.containers?.costItemAdded || 'Cost item added successfully')
      setQuickCostModalOpen(false)
      setCostTitle('')
      setCostAmount('')
      setCostCurrency('USD')
      setCostIsPaid(false)
      setCostNotes('')
      setCostAgentId('')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add cost')
    },
  })

  const updateContainerMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/admin/containers/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update container')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      toast.success('Container updated successfully')
      setEditModalOpen(false)
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error updating container')
    },
  })

  const handleOpenEdit = (container: any) => {
    setEditFormData({
      id: container.id,
      containerNumber: container.containerNumber || '',
      carrierId: container.carrierId || '',
      agentId: container.agentId || '',
      routeType: container.routeType || 'SEA',
      origin: container.origin || '',
      destination: container.destination || '',
      departureDate: container.departureDate ? container.departureDate.substring(0, 10) : '',
      arrivalDate: container.arrivalDate ? container.arrivalDate.substring(0, 10) : '',
      status: container.status || 'PLANNING',
      notes: container.notes || '',
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editFormData.containerNumber.trim()) {
      toast.error('Container number is required')
      return
    }
    updateContainerMutation.mutate(editFormData)
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/containers/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete container')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      toast.success('Container deleted')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error deleting container')
    },
  })

  const handleOpenQuickCost = (container: any) => {
    setSelectedContainer(container)
    setCostTitle('')
    setCostAmount('')
    setCostIsPaid(false)
    setCostNotes('')
    setCostAgentId(container.agentId || 'NONE')
    setQuickCostModalOpen(true)
  }

  const handleSaveQuickCost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!costTitle.trim()) {
      toast.error('Cost title is required')
      return
    }
    const amt = parseFloat(costAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Valid cost amount is required')
      return
    }
    quickCostMutation.mutate({
      containerId: selectedContainer.id,
      title: costTitle.trim(),
      amount: amt,
      currency: costCurrency,
      isPaid: costIsPaid,
      notes: costNotes.trim(),
      agentId: costAgentId && costAgentId !== 'NONE' ? costAgentId : null,
    })
  }

  const getCostPaymentStatus = (container: any) => {
    const costItems = container.costItems || []
    if (costItems.length === 0) return { label: '$0.00', color: 'text-slate-600', badgeBg: 'bg-slate-50 text-slate-700 border-slate-200' }

    // If all cost items share the same non-USD currency, show native total with symbol
    const currenciesUsed = Array.from(new Set<string>(costItems.map((c: any) => (c.currency || 'USD').toUpperCase())))
    const singleCurrency: string | null = currenciesUsed.length === 1 ? (currenciesUsed[0] as string) : null

    let displayAmount = container.totalCost || 0
    let symbol = '$'
    let suffix = ''

    if (singleCurrency && singleCurrency !== 'USD') {
      const nativeTotal = costItems.reduce((sum: number, c: any) => sum + (c.amount || 0), 0)
      displayAmount = nativeTotal
      symbol = getCurrencySymbol(singleCurrency)
      suffix = ` ${singleCurrency}`
    }

    const total = container.totalCost || 0
    const allPaid = costItems.length > 0 && costItems.every((i: any) => i.isPaid)
    const somePaid = costItems.some((i: any) => i.isPaid)

    const formatted = `${symbol}${displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`

    if (allPaid && total > 0) {
      return { label: formatted, color: 'text-emerald-700', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-300' }
    } else if (somePaid) {
      return { label: formatted, color: 'text-amber-700', badgeBg: 'bg-amber-50 text-amber-700 border-amber-300' }
    } else {
      return { label: formatted, color: 'text-rose-700', badgeBg: 'bg-rose-50 text-rose-700 border-rose-300' }
    }
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/20 backdrop-blur rounded-xl border border-white/10">
              <Package className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                {dict.nav.containers}
              </h1>
              <p className="text-sm text-slate-300 mt-0.5">
                Centralized container logistics, real-time cost tracking, and cargo dispatch console
              </p>
            </div>
          </div>
        </div>
        <Link href="/admin/containers/new">
          <Button className="gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold shadow-md">
            <Plus className="w-4 h-4" />
            Create Container
          </Button>
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Containers
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Package className="w-4 h-4 text-slate-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{totalContainers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalCargoUnits > 0 ? (
                <span className="font-semibold text-slate-700">{totalCargoUnits.toLocaleString()} units loaded</span>
              ) : (
                'Tracked shipments across all routes'
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-blue-200/80 shadow-sm hover:shadow transition-shadow bg-blue-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-900">
              In Active Transit
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Ship className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-blue-700">{inTransitCount}</div>
            <p className="text-xs text-blue-800/80 mt-1">Departed, at sea/air, or customs inspection</p>
          </CardContent>
        </Card>

        <Card className="border border-emerald-200/80 shadow-sm hover:shadow transition-shadow bg-emerald-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
              Completed & Delivered
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-700">{deliveredCount}</div>
            <p className="text-xs text-emerald-800/80 mt-1">Successfully arrived & released</p>
          </CardContent>
        </Card>

        <Card className="border border-amber-200/80 shadow-sm hover:shadow transition-shadow bg-amber-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-900">
              {dict.containers?.totalCosts || 'Total Logistics Costs'}
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-amber-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-900 font-mono">
              ${totalFreightValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-amber-800/80 mt-1">
              {totalCargoFobValue > 0 ? (
                <span>Cargo FOB: <strong className="text-amber-950">${totalCargoFobValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
              ) : (
                'Aggregated shipping & customs invoices'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Control Bar */}
      <Card className="border-slate-200/80 shadow-sm w-full max-w-full">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search container number, origin, destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50/60 border-slate-200"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-50/60 border-slate-200">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PLANNING">Planning</SelectItem>
                <SelectItem value="LOADING">Loading</SelectItem>
                <SelectItem value="DEPARTED">Departed</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="AT_CUSTOMS">At Customs</SelectItem>
                <SelectItem value="ARRIVED">Arrived</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={routeFilter} onValueChange={setRouteFilter}>
              <SelectTrigger className="bg-slate-50/60 border-slate-200">
                <SelectValue placeholder="All Route Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Route Types</SelectItem>
                <SelectItem value="SEA">Sea Freight (Ocean)</SelectItem>
                <SelectItem value="AIR">Air Freight (Cargo)</SelectItem>
                <SelectItem value="LAND">Land Trucking</SelectItem>
                <SelectItem value="MULTI">Multi-Modal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={agentFilter || 'ALL'} onValueChange={handleAgentFilterChange}>
              <SelectTrigger className="bg-slate-50/60 border-slate-200">
                <SelectValue placeholder={dict.containers?.filterByAgent || 'Filter by Agent'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Agents</SelectItem>
                {agents.map((ag: any) => (
                  <SelectItem key={ag.id} value={ag.id}>
                    {ag.name} {ag.company ? `(${ag.company})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Active Agent Filter Alert Banner */}
      {agentFilter && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-900 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <span>
              Filtered by Shipping Agent:{' '}
              <strong className="font-bold text-blue-950 text-sm">
                {agents.find((a: any) => a.id === agentFilter)?.name || 'Selected Forwarder'}
              </strong>{' '}
              ({containers.length} container{containers.length === 1 ? '' : 's'} assigned or handled)
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAgentFilterChange('ALL')}
            className="h-7 px-2.5 text-xs text-blue-700 border-blue-300 bg-white hover:bg-blue-100"
          >
            Show All Containers
          </Button>
        </div>
      )}

      {/* Main Containers Table with enhanced sticky Action styling */}
      <Card className="border-slate-200/80 shadow-sm overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full max-w-full relative">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold text-slate-600 uppercase tracking-wider sticky top-0 z-10">
                <th className="py-3 px-2 w-12 text-center text-slate-400">
                  <button
                    type="button"
                    onClick={toggleExpandAll}
                    className="w-7 h-7 inline-flex items-center justify-center rounded hover:bg-slate-200/80 text-slate-600 transition-colors cursor-pointer"
                    title={allExpanded ? 'Collapse all cargo details' : 'Expand all cargo details'}
                  >
                    {allExpanded ? <ChevronDown className="w-4 h-4 text-indigo-600" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </th>
                <th className="py-3 px-3 min-w-[140px]">Container #</th>
                <th className="py-3 px-3 min-w-[105px]">Status</th>
                <th className="py-3 px-3 min-w-[160px]">Route & Transport</th>
                <th className="py-3 px-3 min-w-[120px]">Carrier</th>
                <th className="py-3 px-3 min-w-[125px]">Agent</th>
                <th className="py-3 px-3 min-w-[200px]">Cargo Loaded & Manifest</th>
                <th className="py-3 px-3 min-w-[110px] text-right">{dict.containers?.totalCosts || 'Total Costs'}</th>
                {/* Sticky Right Action Header */}
                <th className="py-3 px-3 min-w-[160px] text-center sticky right-0 z-20 bg-slate-100/95 backdrop-blur-sm border-l border-slate-200/90 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <span className="text-sm text-muted-foreground mt-3 block">Loading container registry...</span>
                  </td>
                </tr>
              ) : containers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-foreground">No containers match your query.</p>
                    <p className="text-xs text-muted-foreground mt-1">Create a new container or adjust your search filters.</p>
                  </td>
                </tr>
              ) : (
                containers.map((container, index) => {
                  const costStatus = getCostPaymentStatus(container)
                  const badgeInfo = statusBadges[container.status] || { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' }
                  const isExpanded = Boolean(expandedRows[container.id])

                  return (
                    <Fragment key={container.id}>
                      <tr className={`hover:bg-slate-50/80 transition-colors group text-xs ${isExpanded ? 'bg-indigo-50/20' : ''}`}>
                        {/* Row Number & Expand Toggle */}
                        <td className="py-2.5 px-2 text-center text-[11px] font-mono font-medium text-slate-400">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => toggleRow(container.id)}
                              className="w-6 h-6 inline-flex items-center justify-center rounded hover:bg-slate-200/80 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                              title={isExpanded ? 'Collapse cargo details' : 'Expand cargo manifest'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                            <span className="text-[10px] text-slate-400 hidden sm:inline">{index + 1}</span>
                          </div>
                        </td>

                        {/* Container Number & Link */}
                        <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                          <Link
                            href={`/admin/containers/${container.id}`}
                            className="text-primary hover:text-primary/80 flex items-center gap-2 group-hover:underline"
                          >
                            <div className="w-6 h-6 rounded-md bg-sky-50 border border-sky-100 flex items-center justify-center text-primary flex-shrink-0">
                              <Package className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-mono text-xs font-bold tracking-tight">{container.containerNumber}</span>
                          </Link>
                        </td>

                        {/* Status with pulsing dot */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeInfo.bg} ${badgeInfo.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badgeInfo.dot}`} />
                            {container.status}
                          </span>
                        </td>

                        {/* Route / Origin & Destination */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs">
                            <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                              {getRouteIcon(container.routeType)}
                            </div>
                            <div className="flex items-center gap-1 font-medium text-slate-700 truncate max-w-[170px]">
                              <span>{container.origin}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span className="text-slate-900 font-semibold">{container.destination}</span>
                            </div>
                          </div>
                        </td>

                        {/* Carrier Line */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {container.carrier ? (
                            <div className="text-xs">
                              <div className="font-medium text-slate-900 leading-tight">{container.carrier.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">({container.carrier.code})</div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Unassigned</span>
                          )}
                        </td>

                        {/* Agents (Multi-agent support) */}
                        <td className="py-2.5 px-3">
                          {(() => {
                            const agentMap = new Map<string, any>();
                            if (container.agent) {
                              agentMap.set(container.agent.id, container.agent);
                            }
                            (container.costItems || []).forEach((ci: any) => {
                              if (ci.agent) {
                                agentMap.set(ci.agent.id, ci.agent);
                              }
                            });
                            const containerAgents = Array.from(agentMap.values());

                            if (containerAgents.length === 0) {
                              return <span className="text-xs text-muted-foreground italic">Unassigned</span>;
                            }

                            return (
                              <div className="flex flex-wrap gap-1 items-center max-w-[150px]">
                                {containerAgents.map((ag: any) => (
                                  <button
                                    key={ag.id}
                                    type="button"
                                    onClick={() => handleAgentFilterChange(ag.id)}
                                    className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 hover:text-blue-900 hover:underline bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"
                                    title={`Filter by ${ag.name}`}
                                  >
                                    <UserCheck className="w-2.5 h-2.5 text-blue-500 flex-shrink-0" />
                                    <span className="truncate max-w-[100px]">{ag.name}</span>
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Cargo Loaded & Manifest Column */}
                        <td className="py-2.5 px-3">
                          {(() => {
                            const items = container.items || []
                            const poList = container.purchaseOrders || []
                            const ordersList = container.orders || []
                            const totalUnits = items.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0)
                            const totalFob = items.reduce((s: number, i: any) => s + (Number(i.totalCost) || ((Number(i.unitCost) || 0) * (Number(i.quantity) || 0))), 0)
                            const poCount = container._count?.purchaseOrders || poList.length
                            const ordersCount = container._count?.orders || ordersList.length
                            const hasCargo = items.length > 0 || poCount > 0 || ordersCount > 0

                            if (!hasCargo) {
                              return (
                                <span className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                                  <Boxes className="w-3.5 h-3.5 text-slate-300" />
                                  Empty (0 cargo)
                                </span>
                              )
                            }

                            return (
                              <div className="space-y-1">
                                {/* Primary cargo badge */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {items.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleRow(container.id)}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                                        isExpanded
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                          : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                      }`}
                                      title="Click to toggle cargo manifest below"
                                    >
                                      <Package className="w-3 h-3" />
                                      <span>{totalUnits.toLocaleString()} Units</span>
                                      <span className={isExpanded ? 'text-indigo-200 text-[10px]' : 'text-indigo-500 text-[10px]'}>
                                        ({items.length} SKU{items.length > 1 ? 's' : ''})
                                      </span>
                                    </button>
                                  )}

                                  {poCount > 0 && (
                                    <span className="bg-amber-50 text-amber-800 text-[10px] font-medium px-1.5 py-0.5 rounded border border-amber-200">
                                      {poCount} PO{poCount > 1 ? 's' : ''}
                                    </span>
                                  )}

                                  {ordersCount > 0 && (
                                    <span className="bg-sky-50 text-sky-800 text-[10px] font-medium px-1.5 py-0.5 rounded border border-sky-200">
                                      {ordersCount} Order{ordersCount > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>

                                {/* Valuation and Quick Toggle details */}
                                <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
                                  {totalFob > 0 && (
                                    <span className="font-mono font-semibold text-slate-800">
                                      FOB: ${totalFob.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleOpenCargoModal(container)}
                                    className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium ml-auto flex items-center gap-0.5 text-[10px] cursor-pointer"
                                    title="Open Quick Cargo Manifest Dialog"
                                  >
                                    <span>Preview</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                </div>

                                {/* SKU Item preview names */}
                                {items.length > 0 && (
                                  <div
                                    className="text-[10px] text-slate-500 truncate max-w-[210px]"
                                    title={items.map((i: any) => `${i.product?.name || 'Product'} (x${i.quantity})`).join(', ')}
                                  >
                                    {items.slice(0, 2).map((i: any) => `${i.product?.name || 'Item'} (x${i.quantity})`).join(', ')}
                                    {items.length > 2 ? `, +${items.length - 2} more` : ''}
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </td>

                        {/* Total Costs Pill */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold border ${costStatus.badgeBg}`}>
                            {costStatus.label}
                          </span>
                        </td>

                        {/* Sticky Right Actions Column with frosted glass shadow */}
                        <td className="py-2 px-3 sticky right-0 z-10 bg-white/95 group-hover:bg-slate-50/95 backdrop-blur-sm border-l border-slate-200/90 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] transition-colors">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* 1. Edit Container Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(container)}
                              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                              title="Edit Container"
                              aria-label="Edit Container"
                            >
                              <Pencil className="w-4 h-4 text-slate-600" />
                            </button>

                            {/* 2. Quick Add Cost Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenQuickCost(container)}
                              className="w-8 h-8 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                              title={dict.containers?.quickAddCost || 'Quick Add Cost'}
                              aria-label={dict.containers?.quickAddCost || 'Quick Add Cost'}
                            >
                              <DollarSign className="w-4 h-4 text-emerald-600" />
                            </button>

                            {/* 3. Open / View Detail Button */}
                            <Link
                              href={`/admin/containers/${container.id}`}
                              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center transition-all shadow-xs"
                              title="View Container Details"
                              aria-label="View Container Details"
                            >
                              <Eye className="w-4 h-4 text-slate-600" />
                            </Link>

                            {/* 4. Delete Container Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete container ${container.containerNumber}?`)) {
                                  deleteMutation.mutate(container.id)
                                }
                              }}
                              className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 hover:text-rose-700 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                              title="Delete Container"
                              aria-label="Delete Container"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Nested Expanded Cargo Manifest Sub-Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b-2 border-indigo-200/80 animate-in fade-in duration-150">
                          <td colSpan={9} className="p-3 sm:p-4">
                            <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden space-y-3">
                              {/* Header bar */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-white border-b border-indigo-100 gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                    <Package className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-sm text-foreground">
                                        Cargo Manifest & Landed Cost Breakdown
                                      </span>
                                      <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded border border-indigo-200">
                                        {container.containerNumber}
                                      </span>
                                      <Badge variant="outline" className="text-[10px] uppercase font-mono bg-white">
                                        {container.loadingType || 'FROM_WAREHOUSE'}
                                      </Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      Route: <strong className="text-foreground">{container.origin}</strong> &rarr; <strong className="text-foreground">{container.destination}</strong>
                                      {container.carrier?.name ? ` • Carrier: ${container.carrier.name}` : ''}
                                      {container.agent?.name ? ` • Forwarder Agent: ${container.agent.name}` : ''}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Link href={`/admin/containers/${container.id}`}>
                                    <Button size="sm" className="h-7 px-3 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
                                      <span>Manage & Load Cargo</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </Button>
                                  </Link>
                                </div>
                              </div>

                              {/* Cargo Summary KPIs */}
                              {(() => {
                                const items = container.items || []
                                const totalUnits = items.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0)
                                const totalFob = items.reduce((s: number, i: any) => s + (Number(i.totalCost) || ((Number(i.unitCost) || 0) * (Number(i.quantity) || 0))), 0)
                                const totalExpenses = container.totalCost || 0
                                const totalLanded = totalFob + totalExpenses

                                return (
                                  <>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-4 pt-1">
                                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                                        <div className="text-[10px] uppercase font-semibold text-slate-500">Loaded SKU Items</div>
                                        <div className="text-base font-extrabold text-slate-900 mt-0.5">
                                          {items.length} SKUs ({totalUnits.toLocaleString()} units)
                                        </div>
                                      </div>
                                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                                        <div className="text-[10px] uppercase font-semibold text-slate-500">Goods FOB Value</div>
                                        <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                                          ${totalFob.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                      <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80">
                                        <div className="text-[10px] uppercase font-semibold text-amber-800">Container Freight & Duties</div>
                                        <div className="text-base font-extrabold text-amber-900 font-mono mt-0.5">
                                          ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
                                        <div className="text-[10px] uppercase font-semibold text-emerald-800">Total Landed Value</div>
                                        <div className="text-base font-extrabold text-emerald-900 font-mono mt-0.5">
                                          ${totalLanded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Loaded Items Table */}
                                    {items.length === 0 ? (
                                      <div className="px-4 py-6 text-center text-xs text-muted-foreground bg-slate-50/50 rounded-lg mx-4 mb-3 border border-dashed border-slate-200">
                                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                                        <p className="font-semibold text-slate-700">No individual products loaded directly yet.</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                          Click &quot;Manage & Load Cargo&quot; to load goods from warehouse inventory or factory purchase orders.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="px-4 pb-2 overflow-x-auto">
                                        <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                                          <thead className="bg-slate-100 text-[11px] font-semibold text-slate-700 uppercase">
                                            <tr className="border-b border-slate-200">
                                              <th className="py-2 px-3">Product / SKU</th>
                                              <th className="py-2 px-2.5">Source</th>
                                              <th className="py-2 px-2.5 text-right">Quantity</th>
                                              <th className="py-2 px-2.5 text-right">FOB Unit Cost</th>
                                              <th className="py-2 px-2.5 text-right">Allocated Freight</th>
                                              <th className="py-2 px-2.5 text-right">Landed Unit Cost</th>
                                              <th className="py-2 px-3 text-right">Line Landed Total</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {items.map((it: any) => {
                                              const qty = Number(it.quantity) || 1
                                              const unitCost = Number(it.unitCost) || 0
                                              const allocTotal = Number(it.allocatedCost) || 0
                                              const allocPerUnit = qty > 0 ? allocTotal / qty : 0
                                              const landedPerUnit = it.landedCostPerUnit && Number(it.landedCostPerUnit) > unitCost 
                                                ? Number(it.landedCostPerUnit) 
                                                : (unitCost + allocPerUnit)
                                              const lineLandedTotal = landedPerUnit * qty

                                              return (
                                                <tr key={it.id} className="hover:bg-slate-50/70">
                                                  <td className="py-2 px-3">
                                                    <div className="font-bold text-slate-900">{it.product?.name || 'Product'}</div>
                                                    <div className="text-[10px] font-mono text-muted-foreground">{it.product?.sku}</div>
                                                  </td>
                                                  <td className="py-2 px-2.5">
                                                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                                                      {it.source}
                                                    </span>
                                                  </td>
                                                  <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                                                    {qty.toLocaleString()}
                                                  </td>
                                                  <td className="py-2 px-2.5 text-right font-mono text-slate-700">
                                                    ${unitCost.toFixed(2)}
                                                  </td>
                                                  <td className="py-2 px-2.5 text-right font-mono text-amber-700 font-semibold">
                                                    +${allocPerUnit.toFixed(2)}
                                                  </td>
                                                  <td className="py-2 px-2.5 text-right font-mono text-emerald-700 font-extrabold">
                                                    ${landedPerUnit.toFixed(2)}
                                                  </td>
                                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                                    ${lineLandedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                  </td>
                                                </tr>
                                              )
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}

                                    {/* Loaded POs if any */}
                                    {(container.purchaseOrders || []).length > 0 && (
                                      <div className="px-4 pb-3">
                                        <div className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                                          <span>Loaded Factory Purchase Orders ({container.purchaseOrders.length})</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {container.purchaseOrders.map((po: any) => (
                                            <div key={po.id} className="p-2 rounded-md bg-amber-50/70 border border-amber-200 text-xs flex items-center gap-2">
                                              <span className="font-mono font-bold text-amber-900">{po.poNumber}</span>
                                              {po.supplier?.name && <span className="text-amber-800">({po.supplier.name})</span>}
                                              <Badge variant="outline" className="text-[10px] bg-white text-amber-800 border-amber-300">
                                                {po.status}
                                              </Badge>
                                              <span className="font-mono font-bold text-slate-900">
                                                ${((po.total ?? po.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Loaded Customer Orders if any */}
                                    {(container.orders || []).length > 0 && (
                                      <div className="px-4 pb-3">
                                        <div className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                          <Package className="w-3.5 h-3.5 text-blue-600" />
                                          <span>Loaded Customer Sales Orders ({container.orders.length})</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {container.orders.map((ord: any) => (
                                            <div key={ord.id} className="p-2 rounded-md bg-blue-50/70 border border-blue-200 text-xs flex items-center gap-2">
                                              <span className="font-mono font-bold text-blue-900">{ord.orderNumber}</span>
                                              <Badge variant="outline" className="text-[10px] bg-white text-blue-800 border-blue-300">
                                                {ord.status}
                                              </Badge>
                                              <span className="font-mono font-bold text-slate-900">
                                                ${(ord.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Cost Entry Modal */}
      <Dialog open={quickCostModalOpen} onOpenChange={setQuickCostModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              {dict.containers?.quickAddCost || 'Quick Add Cost'}
            </DialogTitle>
            <DialogDescription>
              Container: <strong className="text-foreground">{selectedContainer?.containerNumber}</strong> ({selectedContainer?.origin} &rarr; {selectedContainer?.destination})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveQuickCost} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cost-title">{dict.containers?.costTitle || 'Cost Title'} *</Label>
              <Input
                id="cost-title"
                placeholder='e.g., "Port Fee", "Customs Clearance", "Agent Commission"'
                value={costTitle}
                onChange={(e) => setCostTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cost-agent">Assign / Pay to Agent</Label>
              <Select value={costAgentId} onValueChange={setCostAgentId}>
                <SelectTrigger id="cost-agent" className="h-9 text-xs">
                  <SelectValue placeholder="Select Agent to assign / pay..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No Agent (Direct Vendor / Port)</SelectItem>
                  {agents.map((ag: any) => (
                    <SelectItem key={ag.id} value={ag.id}>
                      {ag.name} {ag.company ? `(${ag.company})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="cost-amount">{dict.containers?.costAmount || 'Amount'} *</Label>
                <Input
                  id="cost-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={costAmount}
                  onChange={(e) => setCostAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cost-currency">{dict.containers?.costCurrency || 'Currency'}</Label>
                <Select
                  value={costCurrency}
                  onValueChange={setCostCurrency}
                >
                  <SelectTrigger id="cost-currency" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="CNY">CNY (¥)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="RUB">RUB (₽)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="cost-paid"
                checked={costIsPaid}
                onChange={(e) => setCostIsPaid(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="cost-paid" className="cursor-pointer text-sm font-medium">
                {dict.containers?.costPaid || 'This cost is already paid'}
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cost-notes">{dict.containers?.costNotes || 'Notes'}</Label>
              <textarea
                id="cost-notes"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Optional notes or receipt references..."
                value={costNotes}
                onChange={(e) => setCostNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickCostModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={quickCostMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {quickCostMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add Cost
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit Container Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Pencil className="w-4 h-4 text-primary" />
              Edit Container
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update container information, routing, dates, and status
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-3 pt-1 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-number" className="text-xs">Container Number *</Label>
                <Input
                  id="edit-number"
                  className="h-8 text-xs font-mono"
                  value={editFormData.containerNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, containerNumber: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-status" className="text-xs">Status</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(val) => setEditFormData({ ...editFormData, status: val })}
                >
                  <SelectTrigger id="edit-status" className="h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNING">Planning</SelectItem>
                    <SelectItem value="LOADING">Loading</SelectItem>
                    <SelectItem value="DEPARTED">Departed</SelectItem>
                    <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                    <SelectItem value="AT_CUSTOMS">At Customs</SelectItem>
                    <SelectItem value="ARRIVED">Arrived</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <CountryCityPicker
                label="Origin (Departure Country & Port/City)"
                value={editFormData.origin}
                onChange={(val) => setEditFormData({ ...editFormData, origin: val })}
                required
                compact
                countryPlaceholder="Search departure country..."
                cityPlaceholder="Select port/city..."
                idPrefix="edit-origin"
              />

              <CountryCityPicker
                label="Destination (Arrival Country & Port/City)"
                value={editFormData.destination}
                onChange={(val) => setEditFormData({ ...editFormData, destination: val })}
                required
                compact
                countryPlaceholder="Search destination country..."
                cityPlaceholder="Select arrival port/city..."
                idPrefix="edit-destination"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-routeType" className="text-xs">Route Type</Label>
                <Select
                  value={editFormData.routeType}
                  onValueChange={(val) => setEditFormData({ ...editFormData, routeType: val })}
                >
                  <SelectTrigger id="edit-routeType" className="h-8 text-xs">
                    <SelectValue placeholder="Route Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEA">Sea Freight</SelectItem>
                    <SelectItem value="AIR">Air Freight</SelectItem>
                    <SelectItem value="LAND">Land Trucking</SelectItem>
                    <SelectItem value="MULTI">Multi-Modal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-carrier" className="text-xs">Carrier</Label>
                <Select
                  value={editFormData.carrierId || 'NONE'}
                  onValueChange={(val) => setEditFormData({ ...editFormData, carrierId: val === 'NONE' ? '' : val })}
                >
                  <SelectTrigger id="edit-carrier" className="h-8 text-xs">
                    <SelectValue placeholder="Select Carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No Carrier</SelectItem>
                    {carriers.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-depDate" className="text-xs">Departure Date (ETD)</Label>
                <Input
                  id="edit-depDate"
                  type="date"
                  className="h-8 text-xs"
                  value={editFormData.departureDate}
                  onChange={(e) => setEditFormData({ ...editFormData, departureDate: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-arrDate" className="text-xs">Est. Arrival Date (ETA)</Label>
                <Input
                  id="edit-arrDate"
                  type="date"
                  className="h-8 text-xs"
                  value={editFormData.arrivalDate}
                  onChange={(e) => setEditFormData({ ...editFormData, arrivalDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-notes" className="text-xs">Notes</Label>
              <Input
                id="edit-notes"
                className="h-8 text-xs"
                placeholder="Optional notes..."
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateContainerMutation.isPending}
                className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white"
              >
                {updateContainerMutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Cargo Manifest Modal */}
      <Dialog open={cargoModalOpen} onOpenChange={setCargoModalOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-indigo-600" />
              <span>Loaded Cargo Manifest — {cargoModalContainer?.containerNumber}</span>
            </DialogTitle>
            <DialogDescription>
              Route: <strong>{cargoModalContainer?.origin}</strong> &rarr; <strong>{cargoModalContainer?.destination}</strong>
              {cargoModalContainer?.carrier?.name ? ` • Carrier: ${cargoModalContainer.carrier.name}` : ''}
              {cargoModalContainer?.agent?.name ? ` • Forwarder Agent: ${cargoModalContainer.agent.name}` : ''}
            </DialogDescription>
          </DialogHeader>

          {cargoModalContainer && (
            <div className="space-y-4 pt-2">
              {/* Summary KPIs */}
              {(() => {
                const items = cargoModalContainer.items || []
                const totalUnits = items.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0)
                const totalFob = items.reduce((s: number, i: any) => s + (Number(i.totalCost) || ((Number(i.unitCost) || 0) * (Number(i.quantity) || 0))), 0)
                const totalExpenses = cargoModalContainer.totalCost || 0
                const totalLanded = totalFob + totalExpenses

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                        <div className="text-[10px] uppercase font-semibold text-slate-500">Loaded Cargo Units</div>
                        <div className="text-base font-extrabold text-slate-900 mt-0.5">
                          {totalUnits.toLocaleString()} units
                        </div>
                        <div className="text-[10px] text-muted-foreground">{items.length} unique SKUs</div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                        <div className="text-[10px] uppercase font-semibold text-slate-500">Goods FOB Value</div>
                        <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                          ${totalFob.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Supplier purchase value</div>
                      </div>

                      <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80">
                        <div className="text-[10px] uppercase font-semibold text-amber-800">Allocated Logistics</div>
                        <div className="text-base font-extrabold text-amber-900 font-mono mt-0.5">
                          ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-amber-700">Container expenses</div>
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
                        <div className="text-[10px] uppercase font-semibold text-emerald-800">Total Landed Value</div>
                        <div className="text-base font-extrabold text-emerald-900 font-mono mt-0.5">
                          ${totalLanded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-emerald-700">Goods + Logistics</div>
                      </div>
                    </div>

                    {/* Items table */}
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <Package className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                        <p className="font-semibold text-slate-700">No individual products loaded directly yet.</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Click below to load goods from warehouse inventory or factory purchase orders.
                        </p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[320px] overflow-y-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-[11px] font-semibold text-slate-700 uppercase sticky top-0 z-10">
                            <tr className="border-b border-slate-200">
                              <th className="py-2 px-3">Product / SKU</th>
                              <th className="py-2 px-2.5">Source</th>
                              <th className="py-2 px-2.5 text-right">Quantity</th>
                              <th className="py-2 px-2.5 text-right">FOB Cost</th>
                              <th className="py-2 px-2.5 text-right">Allocated Freight</th>
                              <th className="py-2 px-2.5 text-right">Landed Cost/Unit</th>
                              <th className="py-2 px-3 text-right">Landed Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {items.map((it: any) => {
                              const qty = Number(it.quantity) || 1
                              const unitCost = Number(it.unitCost) || 0
                              const allocTotal = Number(it.allocatedCost) || 0
                              const allocPerUnit = qty > 0 ? allocTotal / qty : 0
                              const landedPerUnit = it.landedCostPerUnit && Number(it.landedCostPerUnit) > unitCost 
                                ? Number(it.landedCostPerUnit) 
                                : (unitCost + allocPerUnit)
                              const lineLandedTotal = landedPerUnit * qty

                              return (
                                <tr key={it.id} className="hover:bg-slate-50">
                                  <td className="py-2 px-3">
                                    <div className="font-bold text-slate-900">{it.product?.name || 'Product'}</div>
                                    <div className="text-[10px] font-mono text-muted-foreground">{it.product?.sku}</div>
                                  </td>
                                  <td className="py-2 px-2.5">
                                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                                      {it.source}
                                    </span>
                                  </td>
                                  <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">{qty.toLocaleString()}</td>
                                  <td className="py-2 px-2.5 text-right font-mono text-slate-700">${unitCost.toFixed(2)}</td>
                                  <td className="py-2 px-2.5 text-right font-mono text-amber-700 font-semibold">+${allocPerUnit.toFixed(2)}</td>
                                  <td className="py-2 px-2.5 text-right font-mono font-extrabold text-emerald-700">${landedPerUnit.toFixed(2)}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                    ${lineLandedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Loaded POs if any */}
                    {(cargoModalContainer.purchaseOrders || []).length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          <span>Loaded Factory Purchase Orders ({cargoModalContainer.purchaseOrders.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {cargoModalContainer.purchaseOrders.map((po: any) => (
                            <div key={po.id} className="p-2 rounded-md bg-amber-50/70 border border-amber-200 text-xs flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-900">{po.poNumber}</span>
                              {po.supplier?.name && <span className="text-amber-800">({po.supplier.name})</span>}
                              <Badge variant="outline" className="text-[10px] bg-white text-amber-800 border-amber-300">
                                {po.status}
                              </Badge>
                              <span className="font-mono font-bold text-slate-900">
                                ${( (po.total ?? po.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Loaded Customer Orders if any */}
                    {(cargoModalContainer.orders || []).length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-blue-600" />
                          <span>Loaded Customer Sales Orders ({cargoModalContainer.orders.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {cargoModalContainer.orders.map((ord: any) => (
                            <div key={ord.id} className="p-2 rounded-md bg-blue-50/70 border border-blue-200 text-xs flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-900">{ord.orderNumber}</span>
                              <Badge variant="outline" className="text-[10px] bg-white text-blue-800 border-blue-300">
                                {ord.status}
                              </Badge>
                              <span className="font-mono font-bold text-slate-900">
                                ${(ord.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setCargoModalOpen(false)} className="text-xs">
                  Close
                </Button>
                <Link href={`/admin/containers/${cargoModalContainer.id}`}>
                  <Button size="sm" className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
                    <span>Open Container Detail Console & Load Goods</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


export default function ContainersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ContainersContent />
    </Suspense>
  )
}
