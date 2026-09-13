'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Package,
  Receipt,
  Truck,
  Ship,
  Plane,
  Layers,
  Calendar,
  Users,
  Plus,
  Trash2,
  Edit,
  Loader2,
  CheckCircle,
  FileText,
  DollarSign,
  CreditCard,
  UserCheck,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  Clock,
  MapPin,
  Anchor,
  Navigation,
  Warehouse,
  Info,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'

const getRouteIcon = (routeType?: string | null) => {
  switch (routeType?.toUpperCase()) {
    case 'AIR':
      return <Plane className="w-3.5 h-3.5 text-sky-600" />
    case 'RAIL':
      return <Truck className="w-3.5 h-3.5 text-amber-600" />
    case 'ROAD':
      return <Truck className="w-3.5 h-3.5 text-emerald-600" />
    case 'SEA':
    default:
      return <Ship className="w-3.5 h-3.5 text-blue-600" />
  }
}

const statusBadges: Record<string, { bg: string; text: string }> = {
  PLANNING: { bg: 'bg-gray-100 border-gray-300', text: 'text-gray-800' },
  LOADING: { bg: 'bg-blue-100 border-blue-300', text: 'text-blue-800' },
  DEPARTED: { bg: 'bg-orange-100 border-orange-300', text: 'text-orange-800' },
  IN_TRANSIT: { bg: 'bg-amber-100 border-amber-300', text: 'text-amber-800' },
  AT_CUSTOMS: { bg: 'bg-red-100 border-red-300', text: 'text-red-800' },
  CUSTOMS_CLEARED: { bg: 'bg-teal-100 border-teal-300', text: 'text-teal-800' },
  ARRIVED: { bg: 'bg-purple-100 border-purple-300', text: 'text-purple-800' },
  WAREHOUSE_RECEIVED: { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800' },
  DELIVERED: { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800' },
  CANCELLED: { bg: 'bg-zinc-800 border-zinc-700', text: 'text-zinc-100' },
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

const formatCurrencyAmount = (amount: number, code?: string | null): string => {
  const sym = getCurrencySymbol(code)
  const curr = (code || 'USD').toUpperCase()
  return `${sym}${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}`
}

export default function ContainerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { dict } = useAdminLocale()
  const containerId = params.id as string

  // Fetch all agents for selection
  const { data: allAgentsData } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['agents'],
    queryFn: () => fetch('/api/admin/agents').then((r) => r.json()),
  })
  const availableAgents = allAgentsData?.data || []

  // Modals
  const [addCostModalOpen, setAddCostModalOpen] = useState(false)
  const [editingCostItem, setEditingCostItem] = useState<any>(null)
  const [addPoModalOpen, setAddPoModalOpen] = useState(false)
  const [addOrderModalOpen, setAddOrderModalOpen] = useState(false)

  // Container Items query
  const { data: containerItemsData, refetch: refetchItems } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['container-items', containerId],
    queryFn: () => fetch(`/api/admin/containers/${containerId}/items`).then((r) => r.json()),
  })
  const containerItems = containerItemsData?.data || []

  // Add Item Modal state
  const [addItemModalOpen, setAddItemModalOpen] = useState(false)
  const [itemForm, setItemForm] = useState({
    productId: '',
    quantity: '1',
    unitCost: '',
    source: 'WAREHOUSE',
  })

  // All products query for selection
  const { data: productsData } = useQuery<{ success: boolean; products: any[] }>({
    queryKey: ['products-list'],
    queryFn: () => fetch('/api/admin/products/bulk').then((r) => r.json()).catch(() => ({ products: [] })),
  })
  const availableProducts = productsData?.products || []

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/admin/containers/${containerId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to add item')
      return res.json()
    },
    onSuccess: () => {
      refetchItems()
      refetch()
      toast.success('Item loaded into container')
      setAddItemModalOpen(false)
      setItemForm({ productId: '', quantity: '1', unitCost: '', source: 'WAREHOUSE' })
    },
    onError: (err: any) => toast.error(err.message),
  })

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/admin/containers/${containerId}/items/${itemId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to remove item')
      return res.json()
    },
    onSuccess: () => {
      refetchItems()
      refetch()
      toast.success('Item removed and stock restored')
    },
    onError: (err: any) => toast.error(err.message),
  })

  // Landed cost allocation mutation
  const allocateMutation = useMutation({
    mutationFn: async (method: string) => {
      const res = await fetch(`/api/admin/containers/${containerId}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to allocate costs')
      return res.json()
    },
    onSuccess: () => {
      refetchItems()
      refetch()
      toast.success('Landed costs allocated across container items')
    },
    onError: (err: any) => toast.error(err.message),
  })

  // QC & Location Receiving Modal State
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [qcItems, setQcItems] = useState<any[]>([])

  // Receive into warehouse mutation
  const receiveContainerMutation = useMutation({
    mutationFn: async (payload?: any) => {
      const res = await fetch(`/api/admin/containers/${containerId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to receive container')
      return res.json()
    },
    onSuccess: (data) => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      toast.success(data.data?.message || 'Container received successfully')
      setReceiveModalOpen(false)
    },
    onError: (err: any) => toast.error(err.message),
  })

  // Cost Form state
  const [costForm, setCostForm] = useState({
    title: '',
    amount: '',
    currency: 'USD',
    agentId: '',
    isPaid: false,
    paidAmount: '',
    paymentReference: '',
    notes: '',
  })

  // Active Tab state (default depends on container loadingType)
  const [activeTab, setActiveTab] = useState<string>('items')

  // Fetch Container Summary (all costs + payments + orders)
  const { data: summaryData, isLoading, refetch } = useQuery<{ success: boolean; data: any }>({
    queryKey: ['container-summary', containerId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/containers/${containerId}/summary`)
      if (!res.ok) throw new Error('Failed to fetch container summary')
      return res.json()
    },
  })

  const summary = summaryData?.data
  const container = summary?.container
  const costs = summary?.costs || { items: [], total: 0, paid: 0, unpaid: 0 }
  const agentPayments = summary?.agentPayments || { items: [], totalPaid: 0, totalOwed: 0, outstanding: 0 }

  // Set default tab when container data arrives
  useEffect(() => {
    if (container?.loadingType) {
      if (container.loadingType === 'DIRECT_FROM_PO') {
        setActiveTab('pos')
      } else if (container.loadingType === 'DIRECT_TO_CUSTOMER') {
        setActiveTab('orders')
      } else {
        setActiveTab('items')
      }
    }
  }, [container?.loadingType])

  // Fetch unassigned/available POs with compatibility check
  const { data: availablePosData } = useQuery<{ success: boolean; purchaseOrders: any[] }>({
    queryKey: ['available-pos', containerId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/containers/${containerId}/available-pos`)
      if (!res.ok) return { success: false, purchaseOrders: [] }
      return res.json()
    },
    enabled: addPoModalOpen,
  })

  // Fetch unassigned Orders
  const { data: unassignedOrdersData } = useQuery<{ orders: any[] }>({
    queryKey: ['unassigned-orders'],
    queryFn: async () => {
      const res = await fetch('/api/admin/orders?limit=50')
      if (!res.ok) return { orders: [] }
      return res.json()
    },
    enabled: addOrderModalOpen,
  })

  // 1. Status transition mutation
  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/admin/containers/${containerId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update status')
      }
      return res.json()
    },
    onSuccess: () => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      toast.success('Container status updated')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Status update failed')
    },
  })

  // 2. Add / Edit Cost Item mutation
  const costMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingCostItem) {
        const res = await fetch(`/api/admin/containers/${containerId}/costs/${editingCostItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to update cost item')
        return res.json()
      } else {
        const res = await fetch(`/api/admin/containers/${containerId}/costs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to add cost item')
        return res.json()
      }
    },
    onSuccess: () => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      toast.success(editingCostItem ? (dict.containers?.costItemUpdated || 'Cost item updated') : (dict.containers?.costItemAdded || 'Cost item added'))
      setAddCostModalOpen(false)
      setEditingCostItem(null)
    },
    onError: (err: any) => toast.error(err.message),
  })

  // Delete cost item mutation
  const deleteCostMutation = useMutation({
    mutationFn: async (costId: string) => {
      const res = await fetch(`/api/admin/containers/${containerId}/costs/${costId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete cost item')
      return res.json()
    },
    onSuccess: () => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      toast.success(dict.containers?.costItemDeleted || 'Cost item deleted')
    },
    onError: (err: any) => toast.error(err.message),
  })

  // Mark cost as paid mutation
  const markCostPaidMutation = useMutation({
    mutationFn: async (costId: string) => {
      const res = await fetch(`/api/admin/containers/${containerId}/costs/${costId}/paid`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to mark cost as paid')
      return res.json()
    },
    onSuccess: () => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      toast.success('Cost marked as paid')
    },
    onError: (err: any) => toast.error(err.message),
  })

  // PO & Order assignment mutations
  const assignPoMutation = useMutation({
    mutationFn: async (poId: string) => {
      const res = await fetch(`/api/admin/containers/${containerId}/assign-po`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseOrderId: poId }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to assign PO')
      return res.json()
    },
    onSuccess: () => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      setAddPoModalOpen(false)
      toast.success('Purchase order loaded into container')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const removePoMutation = useMutation({
    mutationFn: async (poId: string) => {
      const res = await fetch(`/api/admin/containers/${containerId}/remove-po`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseOrderId: poId }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to remove PO')
      return res.json()
    },
    onSuccess: () => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      toast.success('PO removed from container')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const assignOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/admin/containers/${containerId}/assign-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to assign order')
      return res.json()
    },
    onSuccess: () => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      setAddOrderModalOpen(false)
      toast.success('Customer order loaded into container')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const removeOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/admin/containers/${containerId}/remove-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to remove order')
      return res.json()
    },
    onSuccess: () => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      toast.success('Order removed from container')
    },
    onError: (err: any) => toast.error(err.message),
  })

  // Handlers
  const handleOpenAddCost = () => {
    setEditingCostItem(null)
    setCostForm({
      title: '',
      amount: '',
      currency: 'USD',
      agentId: container?.agentId || 'NONE',
      isPaid: false,
      paidAmount: '',
      paymentReference: '',
      notes: '',
    })
    setAddCostModalOpen(true)
  }

  const handleOpenEditCost = (item: any) => {
    setEditingCostItem(item)
    setCostForm({
      title: item.title,
      amount: item.amount.toString(),
      currency: item.currency || 'USD',
      agentId: item.agentId || 'NONE',
      isPaid: Boolean(item.isPaid),
      paidAmount: item.paidAmount ? item.paidAmount.toString() : '',
      paymentReference: item.paymentReference || '',
      notes: item.notes || '',
    })
    setAddCostModalOpen(true)
  }

  const handleSaveCost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!costForm.title.trim()) {
      toast.error('Title is required')
      return
    }
    const amt = parseFloat(costForm.amount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Valid amount is required')
      return
    }
    costMutation.mutate({
      title: costForm.title.trim(),
      amount: amt,
      currency: costForm.currency,
      agentId: costForm.agentId && costForm.agentId !== 'NONE' ? costForm.agentId : null,
      isPaid: costForm.isPaid,
      paidAmount: costForm.isPaid ? (parseFloat(costForm.paidAmount) || amt) : 0,
      paymentReference: costForm.paymentReference.trim() || null,
      notes: costForm.notes.trim() || null,
    })
  }

  // Fetch unassigned POs

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading container summary...</p>
      </div>
    )
  }

  if (!container) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-bold">Container Not Found</h2>
        <Link href="/admin/containers">
          <Button className="mt-4">Back to Containers</Button>
        </Link>
      </div>
    )
  }

  const unassignedPos = availablePosData?.purchaseOrders || []
  const unassignedOrders = (unassignedOrdersData?.orders || []).filter((o) => !o.containerId)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/containers">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Package className="w-6 h-6 text-primary" />
                {container.containerNumber}
              </h1>
              <Badge
                variant="outline"
                className={`font-semibold text-xs ${statusBadges[container.status]?.bg} ${statusBadges[container.status]?.text}`}
              >
                {container.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Route: <span className="font-medium text-foreground">{container.origin}</span> &rarr;{' '}
              <span className="font-medium text-foreground">{container.destination}</span> ({container.routeType})
            </p>
          </div>
        </div>

        {/* Warehouse Receipt Action Button */}
        {container.status !== 'WAREHOUSE_RECEIVED' && container.status !== 'DELIVERED' && (
          <Button
            size="sm"
            onClick={() => {
              // Initialize QC items from cargo items
              setQcItems(
                containerItems.map((it: any) => ({
                  itemId: it.id,
                  productName: it.product?.name || 'Product',
                  sku: it.product?.sku || '',
                  quantity: it.quantity,
                  receivedQty: it.quantity,
                  damagedQty: 0,
                  rejectedQty: 0,
                  qualityNotes: '',
                  locationCode: 'BY-SEC-A-01',
                }))
              )
              setReceiveModalOpen(true)
            }}
            disabled={receiveContainerMutation.isPending}
            className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
          >
            <CheckCircle className="w-4 h-4" />
            Receive into Belarus DC
          </Button>
        )}

        {/* Status Transition Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={container.status} onValueChange={(val) => statusMutation.mutate(val)}>
            <SelectTrigger className="w-[180px] h-9 text-xs font-semibold">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PLANNING">PLANNING</SelectItem>
              <SelectItem value="LOADING">LOADING</SelectItem>
              <SelectItem value="DEPARTED">DEPARTED</SelectItem>
              <SelectItem value="IN_TRANSIT">IN_TRANSIT</SelectItem>
              <SelectItem value="AT_CUSTOMS">AT_CUSTOMS</SelectItem>
              <SelectItem value="CUSTOMS_CLEARED">CUSTOMS_CLEARED</SelectItem>
              <SelectItem value="ARRIVED">ARRIVED</SelectItem>
              <SelectItem value="WAREHOUSE_RECEIVED">WAREHOUSE_RECEIVED</SelectItem>
              <SelectItem value="DELIVERED">DELIVERED</SelectItem>
              <SelectItem value="CANCELLED">CANCELLED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TOP CONTAINER DETAILS CARD */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white via-slate-50/40 to-slate-50/70">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-primary">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Container Details &amp; Transit Specifications</span>
                <span className="text-xs font-mono font-normal text-muted-foreground">({container.containerNumber})</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Logistics tracking, carrier routing, and transit schedule for this shipment.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs font-semibold px-2.5 py-1 ${
                container.loadingType === 'DIRECT_TO_CUSTOMER'
                  ? 'border-purple-300 bg-purple-50 text-purple-800'
                  : container.loadingType === 'DIRECT_FROM_PO'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-blue-300 bg-blue-50 text-blue-800'
              }`}
            >
              {container.loadingType === 'DIRECT_TO_CUSTOMER'
                ? (dict.containers?.directToCustomer || 'Direct Sale to Customer')
                : container.loadingType === 'DIRECT_FROM_PO'
                ? (dict.containers?.directFromPO || 'Direct from Factory PO')
                : (dict.containers?.fromWarehouse || 'From China Warehouse')}
            </Badge>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadges[container.status]?.bg} ${statusBadges[container.status]?.text}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {container.status}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Route & Mode */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-sky-600" />
                <span>Transport Route</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center shrink-0">
                  {getRouteIcon(container.routeType)}
                </div>
                <div className="truncate">
                  <span>{container.origin}</span>
                  <ArrowRight className="inline w-3 h-3 mx-1 text-slate-400" />
                  <span>{container.destination}</span>
                </div>
              </div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Mode: {container.routeType || 'SEA'}
              </div>
            </div>

            {/* Carrier */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Ship className="w-3.5 h-3.5 text-blue-600" />
                <span>Shipping Carrier</span>
              </div>
              <div className="font-bold text-xs text-foreground truncate">
                {container.carrier?.name || 'Unassigned Carrier'}
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {container.carrier?.code ? `Code: ${container.carrier.code}` : 'No carrier code'}
              </div>
            </div>

            {/* Primary Forwarder */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Primary Forwarder</span>
              </div>
              <div className="font-bold text-xs text-foreground truncate">
                {container.agent?.name || 'Direct / None'}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {container.agent?.company || container.agent?.phone || 'No agent assigned'}
              </div>
            </div>

            {/* Departure Date */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>ETD (Departure)</span>
              </div>
              <div className="font-mono font-bold text-xs text-foreground">
                {container.departureDate ? new Date(container.departureDate).toLocaleDateString() : '—'}
              </div>
              <div className="text-[10px] text-slate-500">
                {container.departureDate ? 'Port Departure' : 'Estimated date unset'}
              </div>
            </div>

            {/* Arrival Date */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>ETA (Arrival)</span>
              </div>
              <div className="font-mono font-bold text-xs text-foreground">
                {container.arrivalDate ? new Date(container.arrivalDate).toLocaleDateString() : '—'}
              </div>
              <div className="text-[10px] text-slate-500">
                {container.arrivalDate ? 'Destination Port / DC' : 'Estimated date unset'}
              </div>
            </div>

            {/* Cargo Breakdown */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>Cargo Content</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 text-[10px]">
                  {container.orders?.length || 0} Orders
                </span>
                <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                  {container.purchaseOrders?.length || 0} POs
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {containerItems.length} Loaded SKU Items
              </div>
            </div>
          </div>

          {/* Notes row if any */}
          {container.notes && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground text-[11px] shrink-0">Notes:</span>
              <span className="italic">{container.notes}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 2 Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Cost & Breakdown Card */}
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              {dict.containers?.totalCosts || 'Total Costs'}
            </CardTitle>
            <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-100/50 text-xs">
              {costs.items.length} Items
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-700 font-mono">
                ${(costs.totalUSD !== undefined ? costs.totalUSD : costs.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-semibold text-emerald-600">USD Base</span>
            </div>

            {/* Native Currency breakdown pills if any non-USD exists */}
            {costs.byCurrency && Object.keys(costs.byCurrency).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {Object.entries(costs.byCurrency).map(([curr, val]: [string, any]) => (
                  <span
                    key={curr}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-100/70 text-emerald-800 border border-emerald-200"
                  >
                    <span>{curr}:</span>
                    <span className="font-bold">{getCurrencySymbol(curr)}{val.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-emerald-100 text-muted-foreground">
              <span className="text-emerald-800 font-medium">
                Paid: ${(costs.paidUSD !== undefined ? costs.paidUSD : costs.paid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-red-700 font-medium">
                Unpaid: ${(costs.unpaidUSD !== undefined ? costs.unpaidUSD : costs.unpaid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cargo Loading Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Package className="w-4 h-4 text-primary" />
              Loaded Cargo
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {(container.orders?.length || 0) + (container.purchaseOrders?.length || 0)} Total
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm mt-1">
              <div>
                <span className="text-xs text-muted-foreground block">Customer Orders</span>
                <span className="text-lg font-bold text-foreground">{container.orders?.length || 0}</span>
              </div>
              <div className="border-r h-8" />
              <div>
                <span className="text-xs text-muted-foreground block">Purchase Orders</span>
                <span className="text-lg font-bold text-foreground">{container.purchaseOrders?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SCENARIO CONTEXTUAL BANNER */}
      <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
        container.loadingType === 'DIRECT_TO_CUSTOMER'
          ? 'bg-purple-50/70 border-purple-200 text-purple-950'
          : container.loadingType === 'DIRECT_FROM_PO'
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : 'bg-blue-50/70 border-blue-200 text-blue-950'
      }`}>
        <div className={`p-2 rounded-lg shrink-0 ${
          container.loadingType === 'DIRECT_TO_CUSTOMER'
            ? 'bg-purple-600 text-white'
            : container.loadingType === 'DIRECT_FROM_PO'
            ? 'bg-emerald-600 text-white'
            : 'bg-blue-600 text-white'
        }`}>
          {container.loadingType === 'DIRECT_TO_CUSTOMER' ? (
            <UserCheck className="w-5 h-5" />
          ) : container.loadingType === 'DIRECT_FROM_PO' ? (
            <FileText className="w-5 h-5" />
          ) : (
            <Warehouse className="w-5 h-5" />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs uppercase tracking-wider">
              {dict.containers?.currentScenarioBadge || 'Active Loading Scenario'}:
            </span>
            <span className="font-bold text-sm">
              {container.loadingType === 'DIRECT_TO_CUSTOMER'
                ? (dict.containers?.directToCustomer || 'Direct Container Sale to Customer')
                : container.loadingType === 'DIRECT_FROM_PO'
                ? (dict.containers?.directFromPO || 'Direct from Factory Purchase Order')
                : (dict.containers?.fromWarehouse || 'From China Warehouse Stock')}
            </span>
          </div>
          <p className="text-xs opacity-90 leading-relaxed">
            {container.loadingType === 'DIRECT_TO_CUSTOMER'
              ? (dict.containers?.infoDirectToCustomer || 'Direct Container Sale to Customer: This section is for B2B wholesale orders shipped directly to customer. Goods bypass Belarus warehouse.')
              : container.loadingType === 'DIRECT_FROM_PO'
              ? (dict.containers?.infoDirectFromPO || 'Loading Directly from Purchase Order: Entire POs loaded into container. Goods bypass China warehouse storage.')
              : (dict.containers?.infoFromWarehouse || 'Loading from China Warehouse Stock: Load individual products from China warehouse inventory to replenish Belarus DC.')}
          </p>
        </div>
      </div>

      {/* CONTAINER TABS NAVIGATION */}
      <Tabs defaultValue="items" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full sm:w-auto flex flex-wrap gap-1">
          <TabsTrigger value="items" className="gap-1.5 text-xs">
            <Package className="w-3.5 h-3.5" />
            <span>{dict.containers?.tabItems || 'Cargo Items & Landed Cost'}</span>
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
              {containerItems.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pos" className="gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5" />
            <span>{dict.containers?.tabPOs || 'Loaded POs'}</span>
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
              {container.purchaseOrders?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" />
            <span>{dict.containers?.tabOrders || 'Customer Orders'}</span>
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
              {container.orders?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-1.5 text-xs">
            <DollarSign className="w-3.5 h-3.5" />
            <span>{dict.containers?.tabCosts || 'Container Expenses & Ledger'}</span>
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
              {costs.items.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CARGO ITEMS & LANDED COST ALLOCATION */}
        <TabsContent value="items" className="space-y-4 mt-2">
          {container.loadingType !== 'FROM_WAREHOUSE' && (
            <div className="p-3 bg-muted/40 border border-dashed rounded-lg flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>
                Note: Container is configured as <strong>{container.loadingType}</strong>. Direct product loading is primarily designed for China Warehouse replenishment.
              </span>
            </div>
          )}

          <Card className="border-indigo-200 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <Package className="w-5 h-5 text-indigo-600" />
                  📦 Container Items & Landed Cost Allocation
                </CardTitle>
                <CardDescription className="text-xs">
                  Direct product loading (from China Warehouse stock or Factory PO) with automated landed cost calculation (Freight/Customs).
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Allocation method triggers */}
                <Select defaultValue="VALUE" onValueChange={(val) => allocateMutation.mutate(val)}>
                  <SelectTrigger className="w-[160px] h-8 text-xs font-medium">
                    <SelectValue placeholder="Allocate by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VALUE">Allocate by Value ($)</SelectItem>
                    <SelectItem value="WEIGHT">Allocate by Weight (kg)</SelectItem>
                    <SelectItem value="CBM">Allocate by Volume (CBM)</SelectItem>
                    <SelectItem value="UNITS">Allocate by Units</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  onClick={() => setAddItemModalOpen(true)}
                  className="h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Load Product
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product / SKU</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Purchase Unit Cost</TableHead>
                    <TableHead className="text-right">Allocated Freight/Duties</TableHead>
                    <TableHead className="text-right">Final Landed Cost/Unit</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {containerItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                        No individual products loaded directly yet. Click &ldquo;Load Product&rdquo; to load goods from China stock or PO.
                      </TableCell>
                    </TableRow>
                  ) : (
                    containerItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs font-medium">
                          <div className="font-bold text-foreground">{item.product?.name || 'Product'}</div>
                          <div className="text-[11px] font-mono text-muted-foreground">{item.product?.sku}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {item.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold font-mono">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-muted-foreground">
                          ${(item.unitCost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-amber-700 font-semibold">
                          +${(item.allocatedCost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono font-extrabold text-emerald-700">
                          ${(item.landedCostPerUnit || item.unitCost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm('Remove item from container? Stock will be restored to China DC if loaded from warehouse.')) {
                                removeItemMutation.mutate(item.id)
                              }
                            }}
                          >
                            Unload
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: LOADED PURCHASE ORDERS */}
        <TabsContent value="pos" className="space-y-4 mt-2">
          {container.loadingType === 'FROM_WAREHOUSE' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Caution: This container is marked as <strong>From China Warehouse</strong>. Entire Factory POs loaded here bypass China inventory.
              </span>
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Loaded Purchase Orders (POs)
                </CardTitle>
                <CardDescription className="text-xs">
                  Factory & supplier procurement orders loaded in this container
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setAddPoModalOpen(true)}
                className="h-8 gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                Load Purchase Order
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(container.purchaseOrders || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                        No purchase orders loaded in this container yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    container.purchaseOrders.map((po: any) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-semibold text-xs">
                          <Link href={`/admin/purchase-orders/${po.id}`} className="text-primary hover:underline">
                            {po.poNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono uppercase">
                            {po.purchaseDestination || 'DIRECT_TO_CONTAINER'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{po.supplier?.name || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px]">
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          ${((po.total ?? po.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => removePoMutation.mutate(po.id)}
                          >
                            Unload
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: LOADED CUSTOMER ORDERS */}
        <TabsContent value="orders" className="space-y-4 mt-2">
          {container.loadingType === 'DIRECT_TO_CUSTOMER' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2 text-xs text-purple-900">
              <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                Wholesale customer order assignment. This shipment is destined for direct delivery to the customer.
              </span>
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Loaded Customer Sales Orders
                </CardTitle>
                <CardDescription className="text-xs">
                  End-customer orders assigned to this container shipment
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setAddOrderModalOpen(true)}
                className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                Load Customer Order
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(container.orders || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                        No customer orders loaded in this container yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    container.orders.map((o: any) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-semibold text-xs">
                          <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline">
                            {o.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {o.salesType || (o.isDirectContainer ? 'DIRECT_CONTAINER' : 'STANDARD')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {o.user?.name || o.user?.email || 'Customer'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px]">
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          ${(o.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => removeOrderMutation.mutate(o.id)}
                          >
                            Unload
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: CONTAINER EXPENSES & LEDGER */}
        <TabsContent value="costs" className="space-y-4 mt-2">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  💰 Costs & Expenses
                </CardTitle>
                <CardDescription className="text-xs">
                  Flexible cost items with custom titles, amounts, and payment receipt tracking
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleOpenAddCost}
                className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                {dict.containers?.addCostItem || 'Add Cost Item'}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title / Description</TableHead>
                    <TableHead>Assigned Agent</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Receipt / Reference</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                        {dict.containers?.noCostItems || 'No cost items recorded for this container.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    costs.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold text-xs text-foreground">
                          {item.title}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.agent ? (
                            <span className="inline-flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <UserCheck className="w-3 h-3 text-blue-500" />
                              <span>{item.agent.name}</span>
                              {item.agent.company && <span className="text-[10px] text-muted-foreground">({item.agent.company})</span>}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Direct / None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          <div className="font-bold text-foreground">
                            {getCurrencySymbol(item.currency)}{(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="ml-1 text-[11px] text-muted-foreground font-semibold">{(item.currency || 'USD').toUpperCase()}</span>
                          </div>
                          {(item.currency || 'USD').toUpperCase() !== 'USD' && item.amountUSD !== undefined && (
                            <div className="text-[10px] text-muted-foreground font-normal">
                              &asymp; ${item.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.isPaid ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[11px] gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              {dict.containers?.isPaid || 'Paid'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-[11px] gap-1">
                              <X className="w-3 h-3 text-red-600" />
                              {dict.containers?.unpaid || 'Unpaid'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {item.paymentReference || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {item.notes || '—'}
                        </TableCell>
                        <TableCell className="text-right py-2.5 px-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {!item.isPaid && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400"
                                onClick={() => markCostPaidMutation.mutate(item.id)}
                                title={dict.containers?.markAsPaid || 'Mark as Paid'}
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Paid
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs font-medium text-slate-700 bg-white border-slate-200 hover:bg-slate-50 gap-1"
                              onClick={() => handleOpenEditCost(item)}
                              title="Edit cost item"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs font-medium text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100 hover:border-rose-300 gap-1"
                              title="Delete cost item"
                              onClick={() => {
                                if (confirm(`Delete cost item "${item.title}"?`)) {
                                  deleteCostMutation.mutate(item.id)
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Costs Footer Summary */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-muted/20 border-t text-xs font-semibold">
                <span className="text-muted-foreground">Total: {costs.items.length} cost items</span>
                <div className="flex items-center gap-4">
                  <span>Total: ${(costs.totalUSD !== undefined ? costs.totalUSD : costs.total).toFixed(2)} USD</span>
                  <span className="text-emerald-700">Paid: ${(costs.paidUSD !== undefined ? costs.paidUSD : costs.paid).toFixed(2)} USD</span>
                  <span className="text-red-700">Unpaid: ${(costs.unpaidUSD !== undefined ? costs.unpaidUSD : costs.unpaid).toFixed(2)} USD</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL: LOAD PRODUCT INTO CONTAINER */}
      <Dialog open={addItemModalOpen} onOpenChange={setAddItemModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              Load Product into Container
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deducts stock from China Warehouse and records dispatch ledger.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!itemForm.productId) {
                toast.error('Please select a product')
                return
              }
              addItemMutation.mutate({
                productId: itemForm.productId,
                quantity: Number(itemForm.quantity) || 1,
                unitCost: itemForm.unitCost ? Number(itemForm.unitCost) : undefined,
                source: itemForm.source,
              })
            }}
            className="space-y-3 pt-2"
          >
            <div className="space-y-1">
              <Label className="text-xs">Select Product *</Label>
              <Select value={itemForm.productId} onValueChange={(val) => setItemForm({ ...itemForm, productId: val })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Choose product..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {availableProducts.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit Cost (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Auto from product"
                  value={itemForm.unitCost}
                  onChange={(e) => setItemForm({ ...itemForm, unitCost: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Source</Label>
              <Select value={itemForm.source} onValueChange={(val) => setItemForm({ ...itemForm, source: val })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WAREHOUSE">China Warehouse Stock (CN-YW)</SelectItem>
                  <SelectItem value="PO">Direct Factory PO (No China Storage)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddItemModalOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={addItemMutation.isPending} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                {addItemMutation.isPending ? 'Loading...' : 'Load into Container'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 1: ADD / EDIT COST ITEM */}
      <Dialog open={addCostModalOpen} onOpenChange={setAddCostModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              {editingCostItem ? (dict.containers?.editCostItem || 'Edit Cost Item') : (dict.containers?.addCostItem || 'Add Cost Item')}
            </DialogTitle>
            <DialogDescription>
              Container: <strong className="text-foreground">{container.containerNumber}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCost} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="item-title">{dict.containers?.costTitle || 'Cost Title'} *</Label>
              <Input
                id="item-title"
                placeholder='e.g., "Port Fee", "Customs Broker", "Documentation"'
                value={costForm.title}
                onChange={(e) => setCostForm({ ...costForm, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-agent">Pay to / Assigned Agent</Label>
              <Select
                value={costForm.agentId || 'NONE'}
                onValueChange={(val) => setCostForm({ ...costForm, agentId: val })}
              >
                <SelectTrigger id="item-agent">
                  <SelectValue placeholder="Select Agent to receive payment..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No Agent (Direct Vendor / Port / Carrier)</SelectItem>
                  {availableAgents.map((ag: any) => (
                    <SelectItem key={ag.id} value={ag.id}>
                      {ag.name} {ag.company ? `(${ag.company})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Costs paid to an agent will automatically track under Agent Payments and agent balance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="item-amount">{dict.containers?.costAmount || 'Amount'} *</Label>
                <Input
                  id="item-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={costForm.amount}
                  onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-currency">{dict.containers?.costCurrency || 'Currency'}</Label>
                <Select
                  value={costForm.currency}
                  onValueChange={(val) => setCostForm({ ...costForm, currency: val })}
                >
                  <SelectTrigger id="item-currency">
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
                id="item-paid"
                checked={costForm.isPaid}
                onChange={(e) => setCostForm({ ...costForm, isPaid: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="item-paid" className="cursor-pointer text-sm font-medium">
                {dict.containers?.costPaid || 'This cost is already paid'}
              </Label>
            </div>

            {costForm.isPaid && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border">
                <div className="space-y-1.5">
                  <Label htmlFor="item-paid-amount">{dict.containers?.paidAmount || 'Paid Amount'}</Label>
                  <Input
                    id="item-paid-amount"
                    type="number"
                    step="0.01"
                    placeholder={costForm.amount || '0.00'}
                    value={costForm.paidAmount}
                    onChange={(e) => setCostForm({ ...costForm, paidAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="item-ref">{dict.containers?.paymentReference || 'Receipt / Ref #'}</Label>
                  <Input
                    id="item-ref"
                    placeholder="REC-00123"
                    value={costForm.paymentReference}
                    onChange={(e) => setCostForm({ ...costForm, paymentReference: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="item-notes">{dict.containers?.costNotes || 'Notes'}</Label>
              <textarea
                id="item-notes"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Optional notes..."
                value={costForm.notes}
                onChange={(e) => setCostForm({ ...costForm, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setAddCostModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={costMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {costMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save Cost
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>



      {/* MODAL 3: LOAD PURCHASE ORDER */}
      <Dialog open={addPoModalOpen} onOpenChange={setAddPoModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Load Purchase Order into Container</DialogTitle>
            <DialogDescription>
              Select an unassigned purchase order to load into {container.containerNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[380px] overflow-y-auto space-y-2 pt-2">
            {unassignedPos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No unassigned purchase orders available.
              </p>
            ) : (
              unassignedPos.map((po: any) => {
                const isCompatible = po.isCompatible !== false
                return (
                  <div
                    key={po.id}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                      isCompatible ? 'hover:bg-muted/40' : 'bg-muted/30 opacity-75 border-dashed'
                    }`}
                  >
                    <div className="space-y-1 max-w-[340px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">{po.poNumber}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {po.purchaseDestination || 'CHINA_WAREHOUSE'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground block truncate">
                        {po.supplier?.name || po.supplier?.companyName || 'Supplier'} • ${((po.total ?? po.totalAmount) || 0).toLocaleString()}
                        {po.targetCustomer && (
                          <span className="text-purple-700 dark:text-purple-400 font-medium ml-1.5">
                            &rarr; {po.targetCustomer.name || po.targetCustomer.email}
                          </span>
                        )}
                      </span>
                      {!isCompatible && po.incompatibilityReason && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{po.incompatibilityReason}</span>
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1"
                      disabled={!isCompatible || assignPoMutation.isPending}
                      onClick={() => assignPoMutation.mutate(po.id)}
                    >
                      {assignPoMutation.isPending ? 'Loading...' : 'Load'}
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: LOAD CUSTOMER ORDER */}
      <Dialog open={addOrderModalOpen} onOpenChange={setAddOrderModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Load Customer Order into Container</DialogTitle>
            <DialogDescription>
              Select an unassigned order to assign to {container.containerNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[350px] overflow-y-auto space-y-2 pt-2">
            {unassignedOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No unassigned customer orders available.
              </p>
            ) : (
              unassignedOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <span className="font-semibold text-xs block text-foreground">{o.orderNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {o.user?.name || o.user?.email || 'Customer'} • ${(o.total || 0).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1"
                    disabled={assignOrderMutation.isPending}
                    onClick={() => assignOrderMutation.mutate(o.id)}
                  >
                    Load
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* MODAL: QUALITY CONTROL & LOCATION RECEIPT */}
      <Dialog open={receiveModalOpen} onOpenChange={setReceiveModalOpen}>
        <DialogContent className="sm:max-w-[750px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Receive Container Cargo — Quality Control & Location Assignment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Verify physical counts received for container {container?.containerNumber}. Record damaged or rejected units and assign warehouse location codes.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[420px] overflow-y-auto space-y-4 pt-2">
            {qcItems.map((it, idx) => (
              <div key={it.itemId} className="p-3 border rounded-xl bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{it.productName}</span>
                    <span className="text-[11px] font-mono text-gray-400">SKU: {it.sku} • Cargo Loaded: {it.quantity} units</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <Label className="text-[11px] text-gray-600">Good Recv Qty</Label>
                    <Input
                      type="number"
                      value={it.receivedQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0
                        const updated = [...qcItems]
                        updated[idx].receivedQty = val
                        setQcItems(updated)
                      }}
                      className="h-8 text-xs font-mono font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] text-gray-600">Damaged Qty</Label>
                    <Input
                      type="number"
                      value={it.damagedQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0
                        const updated = [...qcItems]
                        updated[idx].damagedQty = val
                        setQcItems(updated)
                      }}
                      className="h-8 text-xs font-mono text-amber-700"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] text-gray-600">Rejected Qty</Label>
                    <Input
                      type="number"
                      value={it.rejectedQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0
                        const updated = [...qcItems]
                        updated[idx].rejectedQty = val
                        setQcItems(updated)
                      }}
                      className="h-8 text-xs font-mono text-red-700"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] text-gray-600">Location Code</Label>
                    <Input
                      type="text"
                      value={it.locationCode}
                      onChange={(e) => {
                        const updated = [...qcItems]
                        updated[idx].locationCode = e.target.value
                        setQcItems(updated)
                      }}
                      placeholder="e.g. BY-Z1-B2-S03"
                      className="h-8 text-xs font-mono font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] text-gray-500">QC Inspection Notes</Label>
                  <Input
                    type="text"
                    value={it.qualityNotes}
                    onChange={(e) => {
                      const updated = [...qcItems]
                      updated[idx].qualityNotes = e.target.value
                      setQcItems(updated)
                    }}
                    placeholder="e.g. Inspected packaging intact, 0 defects"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setReceiveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={receiveContainerMutation.isPending}
              onClick={() => {
                receiveContainerMutation.mutate({ items: qcItems })
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
            >
              {receiveContainerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Receiving Stock...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Finalize Receipt into Belarus DC
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
