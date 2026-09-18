'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Package, DollarSign, Loader2, Plus, Trash2, Warehouse, FileText, UserCheck } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'
import { CountryCityPicker } from '@/components/admin/containers/CountryCityPicker'

interface InitialCost {
  title: string
  amount: number
  currency: string
  agentId?: string
  isPaid: boolean
  notes: string
}

export default function NewContainerPage() {
  const router = useRouter()
  const { dict } = useAdminLocale()

  const [formData, setFormData] = useState({
    containerNumber: '',
    loadingType: 'FROM_WAREHOUSE',
    carrierId: '',
    agentId: '',
    routeType: 'SEA',
    origin: 'Yiwu, China',
    destination: '',
    departureDate: '',
    arrivalDate: '',
    notes: '',
  })

  // Dynamic initial cost items
  const [costItems, setCostItems] = useState<InitialCost[]>([
    { title: 'Ocean Freight', amount: 0, currency: 'USD', agentId: '', isPaid: false, notes: '' },
    { title: 'Port Handling & Drayage', amount: 0, currency: 'USD', agentId: '', isPaid: false, notes: '' },
  ])

  // Load carriers and agents for dropdowns
  const { data: carriersData } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['carriers'],
    queryFn: () => fetch('/api/admin/carriers').then((r) => r.json()),
  })

  const { data: agentsData } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['agents'],
    queryFn: () => fetch('/api/admin/agents').then((r) => r.json()),
  })

  const carriers = carriersData?.data || []
  const agents = agentsData?.data || []

  const totalCost = costItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  const handleAddCostRow = () => {
    setCostItems([...costItems, { title: '', amount: 0, currency: 'USD', agentId: formData.agentId || '', isPaid: false, notes: '' }])
  }

  const handleRemoveCostRow = (index: number) => {
    setCostItems(costItems.filter((_, i) => i !== index))
  }

  const handleCostChange = (index: number, field: keyof InitialCost, value: any) => {
    const updated = [...costItems]
    updated[index] = { ...updated[index], [field]: value }
    setCostItems(updated)
  }

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create container')
      }
      return res.json()
    },
    onSuccess: (res) => {
      toast.success('Container created successfully')
      router.push(`/admin/containers/${res.data.id}`)
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error creating container')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.containerNumber.trim()) {
      toast.error('Container number is required')
      return
    }
    if (!formData.destination.trim()) {
      toast.error('Destination is required')
      return
    }

    const payload = {
      ...formData,
      initialCostItems: costItems.filter((item) => item.title.trim() && Number(item.amount) > 0),
    }

    createMutation.mutate(payload)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="flex items-center gap-4">
        <Link href="/admin/containers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Containers
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Container</h1>
          <p className="text-xs text-muted-foreground">
            Record a new shipping container, assign carrier & agent, and enter flexible cost items
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Loading Scenario Selection */}
        <Card className="border-indigo-100 dark:border-indigo-950/50">
          <CardHeader className="bg-indigo-50/40 dark:bg-indigo-950/20 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              {dict.containers.loadingType || 'Container Loading Scenario'}
            </CardTitle>
            <CardDescription className="text-xs">
              {dict.containers.switchScenarioPrompt || 'Select how goods will be loaded into this container.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: FROM_WAREHOUSE */}
              <label
                onClick={() => setFormData({ ...formData, loadingType: 'FROM_WAREHOUSE' })}
                className={`relative flex flex-col p-3.5 rounded-lg border cursor-pointer transition-all ${
                  formData.loadingType === 'FROM_WAREHOUSE'
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-600'
                    : 'border-border hover:border-gray-300 dark:hover:border-zinc-700 bg-card'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className={`p-1.5 rounded-md ${formData.loadingType === 'FROM_WAREHOUSE' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-xs text-foreground">
                    {dict.containers.fromWarehouse || 'From China Warehouse'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {dict.containers.fromWarehouseDesc || 'Load individual products from China warehouse inventory to replenish Belarus DC.'}
                </p>
              </label>

              {/* Option 2: DIRECT_FROM_PO */}
              <label
                onClick={() => setFormData({ ...formData, loadingType: 'DIRECT_FROM_PO' })}
                className={`relative flex flex-col p-3.5 rounded-lg border cursor-pointer transition-all ${
                  formData.loadingType === 'DIRECT_FROM_PO'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-600'
                    : 'border-border hover:border-gray-300 dark:hover:border-zinc-700 bg-card'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className={`p-1.5 rounded-md ${formData.loadingType === 'DIRECT_FROM_PO' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-xs text-foreground">
                    {dict.containers.directFromPO || 'Direct from Factory PO'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {dict.containers.directFromPODesc || 'Load entire factory Purchase Orders directly into container. Bypasses China warehouse.'}
                </p>
              </label>

              {/* Option 3: DIRECT_TO_CUSTOMER */}
              <label
                onClick={() => setFormData({ ...formData, loadingType: 'DIRECT_TO_CUSTOMER' })}
                className={`relative flex flex-col p-3.5 rounded-lg border cursor-pointer transition-all ${
                  formData.loadingType === 'DIRECT_TO_CUSTOMER'
                    ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/30 ring-1 ring-purple-600'
                    : 'border-border hover:border-gray-300 dark:hover:border-zinc-700 bg-card'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className={`p-1.5 rounded-md ${formData.loadingType === 'DIRECT_TO_CUSTOMER' ? 'bg-purple-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-xs text-foreground">
                    {dict.containers.directToCustomer || 'Direct Sale to Customer'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {dict.containers.directToCustomerDesc || 'Wholesale B2B container order shipped directly to buyer. Bypasses Belarus DC.'}
                </p>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Basic Container Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Container & Route Details
            </CardTitle>
            <CardDescription>Specify the container identifier, route type, and route endpoints.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="containerNumber">Container Number *</Label>
                <Input
                  id="containerNumber"
                  value={formData.containerNumber}
                  onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. MSKU9012345, COSU889911"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="routeType">Route Transport Mode</Label>
                <Select
                  value={formData.routeType}
                  onValueChange={(val) => setFormData({ ...formData, routeType: val })}
                >
                  <SelectTrigger id="routeType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEA">Sea Freight (Ocean)</SelectItem>
                    <SelectItem value="AIR">Air Cargo</SelectItem>
                    <SelectItem value="LAND">Land Trucking</SelectItem>
                    <SelectItem value="MULTI">Multi-Modal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="carrierId">Assigned Carrier (Line)</Label>
                <Select
                  value={formData.carrierId}
                  onValueChange={(val) => setFormData({ ...formData, carrierId: val })}
                >
                  <SelectTrigger id="carrierId">
                    <SelectValue placeholder="Select shipping carrier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {carriers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="agentId">Assigned Shipping Agent</Label>
                <Select
                  value={formData.agentId}
                  onValueChange={(val) => setFormData({ ...formData, agentId: val })}
                >
                  <SelectTrigger id="agentId">
                    <SelectValue placeholder="Select shipping agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} {a.company ? `(${a.company})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Route Corridors Section: Origin & Destination */}
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-950/60 bg-blue-50/30 dark:bg-blue-950/20">
                <CountryCityPicker
                  label="1. Origin / Departure Point (Country & Port)"
                  value={formData.origin}
                  onChange={(val) => setFormData({ ...formData, origin: val })}
                  defaultCountry="China"
                  defaultCity="Yiwu"
                  required
                  countryPlaceholder="Search & select departure country..."
                  cityPlaceholder="Select departure port or trade hub (e.g. Yiwu, Ningbo, Shanghai)..."
                  helperText="Maritime port, dry port, or warehouse location where cargo originates or loads."
                  idPrefix="origin"
                />
              </div>

              <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/30 dark:bg-emerald-950/20">
                <CountryCityPicker
                  label="2. Destination / Arrival Point (Country & Port)"
                  value={formData.destination}
                  onChange={(val) => setFormData({ ...formData, destination: val })}
                  defaultCountry="Belarus"
                  defaultCity="Minsk"
                  required
                  countryPlaceholder="Search & select destination country..."
                  cityPlaceholder="Select discharge port or destination city (e.g. Minsk, Moscow, Istanbul)..."
                  helperText="Discharge port, customs clearance terminal, or distribution center."
                  idPrefix="destination"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="departureDate">Departure Date (ETD)</Label>
                <Input
                  id="departureDate"
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="arrivalDate">Estimated Arrival Date (ETA)</Label>
                <Input
                  id="arrivalDate"
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flexible Cost Items Section */}
        <Card className="border-emerald-200">
          <CardHeader className="bg-emerald-50/40 border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-emerald-950">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Initial Costs & Expenses
                </CardTitle>
                <CardDescription className="text-emerald-900/70">
                  Enter custom cost categories and amounts. Additional costs can be added anytime.
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-800 font-medium">Total Invoiced:</div>
                <div className="text-2xl font-bold text-emerald-900">${totalCost.toFixed(2)}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-3">
            {costItems.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-2.5 border rounded-lg bg-background">
                <div className="flex-1 min-w-[180px]">
                  <Input
                    placeholder="Cost title (e.g. Ocean Freight, Port Fee)"
                    value={item.title}
                    onChange={(e) => handleCostChange(index, 'title', e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="w-full sm:w-52">
                  <Select
                    value={item.agentId || 'NONE'}
                    onValueChange={(val) => handleCostChange(index, 'agentId', val === 'NONE' ? '' : val)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Pay to Agent (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No Agent (Direct Vendor)</SelectItem>
                      {agents.map((ag: any) => (
                        <SelectItem key={ag.id} value={ag.id}>
                          {ag.name} {ag.company ? `(${ag.company})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-28">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={item.amount || ''}
                    onChange={(e) => handleCostChange(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="h-9 text-xs font-mono font-semibold"
                  />
                </div>
                <div className="w-full sm:w-24">
                  <Select
                    value={item.currency || 'USD'}
                    onValueChange={(val) => handleCostChange(index, 'currency', val)}
                  >
                    <SelectTrigger className="h-9 text-xs">
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
                <div className="flex items-center space-x-1.5 px-2">
                  <input
                    type="checkbox"
                    id={`paid-${index}`}
                    checked={item.isPaid}
                    onChange={(e) => handleCostChange(index, 'isPaid', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary"
                  />
                  <Label htmlFor={`paid-${index}`} className="text-xs cursor-pointer select-none">
                    Paid
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 flex-shrink-0"
                  onClick={() => handleRemoveCostRow(index)}
                  title="Remove cost row"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCostRow}
              className="gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Cost Category
            </Button>
          </CardContent>
        </Card>

        {/* Additional Operational Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operational Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={3}
              placeholder="Any special handling instructions, container seal numbers, or forwarding notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/containers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending} className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white">
            {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save & Open Container
          </Button>
        </div>
      </form>
    </div>
  )
}
