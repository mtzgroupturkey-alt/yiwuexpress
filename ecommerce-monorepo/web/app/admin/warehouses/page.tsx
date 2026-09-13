'use client'

import { useState } from 'react'
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
  Warehouse as WarehouseIcon,
  Layers,
  MapPin,
  Plus,
  ArrowRight,
  Package,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function WarehousesPage() {
  const queryClient = useQueryClient()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    code: '',
    type: 'DISTRIBUTION',
    country: 'Belarus',
    city: 'Minsk',
    address: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    isDefaultProcurement: false,
    isDefaultSales: false,
    notes: '',
  })

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['admin-warehouses'],
    queryFn: async () => {
      const res = await fetch('/api/admin/warehouses')
      if (!res.ok) throw new Error('Failed to fetch warehouses')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create warehouse')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-warehouses'] })
      toast.success('Warehouse created successfully')
      setCreateModalOpen(false)
      setForm({
        name: '',
        code: '',
        type: 'DISTRIBUTION',
        country: 'Belarus',
        city: 'Minsk',
        address: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: '',
        isDefaultProcurement: false,
        isDefaultSales: false,
        notes: '',
      })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim() || !form.address.trim()) {
      toast.error('Name, Code, and Address are required')
      return
    }
    createMutation.mutate(form)
  }

  const warehouses = data?.data || []

  return (
    <div className="w-full max-w-full min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <WarehouseIcon className="w-7 h-7 text-indigo-600" />
            Warehouse & Fulfillment Network
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dual-warehouse architecture: China Procurement DC & Belarus Sales Distribution Center.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9 gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="h-9 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Add Warehouse
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-muted-foreground mt-3">Loading warehouse network...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warehouses.map((wh) => (
            <Card
              key={wh.id}
              className={
                wh.isDefaultProcurement
                  ? 'border-2 border-amber-400 bg-amber-50/10'
                  : wh.isDefaultSales
                  ? 'border-2 border-indigo-400 bg-indigo-50/10'
                  : 'border-2 border-border'
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg font-bold text-foreground">
                        {wh.name}
                      </CardTitle>
                      <Badge variant="outline" className="font-mono font-bold text-xs">
                        {wh.code}
                      </Badge>
                      {wh.isDefaultProcurement && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold">
                          China Procurement Hub
                        </Badge>
                      )}
                      {wh.isDefaultSales && (
                        <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold">
                          Belarus Sales DC
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-1.5 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{wh.city}, {wh.country} — {wh.address}</span>
                    </CardDescription>
                  </div>
                  <Badge variant={wh.isActive ? 'default' : 'secondary'} className="text-xs">
                    {wh.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg text-center">
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">On-Hand Stock</span>
                    <span className="text-xl font-extrabold text-foreground font-mono">
                      {(wh.totalStockUnits || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-x border-border">
                    <span className="text-[11px] text-muted-foreground block font-medium">Reserved (24h)</span>
                    <span className="text-xl font-extrabold text-amber-600 font-mono">
                      {(wh.totalReservedUnits || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">Available</span>
                    <span className="text-xl font-extrabold text-emerald-600 font-mono">
                      {(wh.totalAvailableUnits || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Zones Summary */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Storage Zones & Addressing:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {wh.zones?.length > 0 ? (
                      wh.zones.map((z: any) => (
                        <span
                          key={z.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-background border border-border text-foreground"
                        >
                          <span className="font-mono text-indigo-600">{z.code}</span>
                          <span className="text-muted-foreground">({z.name})</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No zones configured</span>
                    )}
                  </div>
                </div>

                {/* Contact info */}
                {(wh.contactPerson || wh.contactPhone || wh.contactEmail) && (
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>Contact: {wh.contactPerson || 'Warehouse Manager'}</span>
                    <span className="font-mono">{wh.contactPhone || wh.contactEmail}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex justify-end gap-2">
                  <Link href={`/admin/inventory?warehouseId=${wh.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                      <Package className="w-3.5 h-3.5" />
                      View Inventory
                    </Button>
                  </Link>
                  <Link href={`/admin/warehouses/${wh.id}`}>
                    <Button size="sm" className="h-8 text-xs gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                      Manage Zones & Slots
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Warehouse Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Warehouse Facility</DialogTitle>
            <DialogDescription>
              Register a new logistics hub or storage location into the dual-warehouse network.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Warehouse Name *</Label>
                <Input
                  required
                  placeholder="e.g. Warsaw Transit Hub"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Code * (Unique)</Label>
                <Input
                  required
                  placeholder="e.g. PL-WAW"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="h-8 text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Country *</Label>
                <Input
                  required
                  placeholder="e.g. Poland"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">City *</Label>
                <Input
                  required
                  placeholder="e.g. Warsaw"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Full Address *</Label>
              <Input
                required
                placeholder="Logistics park address..."
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Contact Person</Label>
                <Input
                  placeholder="Manager name"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input
                  placeholder="+48 22 123 4567"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Warehouse'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
