'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
  ArrowLeft,
  Layers,
  MapPin,
  Plus,
  Loader2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function WarehouseDetailPage() {
  const params = useParams()
  const warehouseId = params.id as string
  const queryClient = useQueryClient()

  const [addZoneOpen, setAddZoneOpen] = useState(false)
  const [zoneForm, setZoneForm] = useState({
    code: '',
    name: '',
    type: 'STORAGE',
  })

  const { data, isLoading } = useQuery<{ success: boolean; data: any }>({
    queryKey: ['admin-warehouse-detail', warehouseId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/warehouses/${warehouseId}`)
      if (!res.ok) throw new Error('Failed to fetch warehouse')
      return res.json()
    },
  })

  const addZoneMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/admin/warehouses/${warehouseId}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to add zone')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-warehouse-detail', warehouseId] })
      toast.success('Zone added successfully')
      setAddZoneOpen(false)
      setZoneForm({ code: '', name: '', type: 'STORAGE' })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const warehouse = data?.data

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-muted-foreground mt-3">Loading warehouse location layout...</p>
      </div>
    )
  }

  if (!warehouse) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-lg font-bold">Warehouse not found</h2>
        <Link href="/admin/warehouses">
          <Button variant="outline">Back to Warehouses</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/warehouses">
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Warehouses
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{warehouse.name}</h1>
            <Badge variant="outline" className="font-mono font-bold text-xs">{warehouse.code}</Badge>
            {warehouse.isDefaultProcurement && <Badge className="bg-amber-500 text-white text-[11px]">China Hub</Badge>}
            {warehouse.isDefaultSales && <Badge className="bg-indigo-600 text-white text-[11px]">Belarus Sales DC</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {warehouse.address}, {warehouse.city}, {warehouse.country}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setAddZoneOpen(true)} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add Zone
          </Button>
        </div>
      </div>

      {/* Hierarchy: Zones -> Bays -> Slots */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          Location Hierarchy (Zone → Bay → Slot)
        </h2>

        {(warehouse.zones || []).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-xs text-muted-foreground">
              No zones configured for this warehouse yet. Click &ldquo;Add Zone&rdquo; to start configuring locations.
            </CardContent>
          </Card>
        ) : (
          warehouse.zones.map((zone: any) => (
            <Card key={zone.id} className="border-border">
              <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="font-mono bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                      {zone.code}
                    </Badge>
                    <span className="font-bold text-sm text-foreground">{zone.name}</span>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {zone.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {zone.bays?.length || 0} Bays
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(zone.bays || []).map((bay: any) => (
                    <div key={bay.id} className="p-3 border rounded-lg bg-background space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="font-mono text-indigo-600">{bay.code}</span>
                        <span className="text-muted-foreground">Level {bay.level}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground block font-medium">Slots:</span>
                        <div className="flex flex-wrap gap-1">
                          {(bay.slots || []).map((slot: any) => (
                            <span
                              key={slot.id}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted border text-foreground"
                              title={slot.barcode ? `Barcode: ${slot.barcode}` : slot.code}
                            >
                              {slot.code}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Zone Dialog */}
      <Dialog open={addZoneOpen} onOpenChange={setAddZoneOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Warehouse Zone</DialogTitle>
            <DialogDescription>Define a functional area (Storage, Receiving, Picking, etc.)</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!zoneForm.code || !zoneForm.name) return
              addZoneMutation.mutate(zoneForm)
            }}
            className="space-y-3 pt-2"
          >
            <div className="space-y-1">
              <Label className="text-xs">Zone Code *</Label>
              <Input
                required
                placeholder="e.g. Z-STOR-02"
                value={zoneForm.code}
                onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value })}
                className="h-8 text-xs font-mono uppercase"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zone Name *</Label>
              <Input
                required
                placeholder="e.g. Pallet Racking B"
                value={zoneForm.name}
                onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddZoneOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={addZoneMutation.isPending} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                {addZoneMutation.isPending ? 'Adding...' : 'Add Zone'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
