'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Edit, Trash2, Truck, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminLocale } from '../contexts/AdminLocaleContext'

interface Carrier {
  id: string
  name: string
  code: string
  isActive: boolean
  createdAt: string
  _count?: {
    containers: number
  }
}

export default function CarriersPage() {
  const { dict } = useAdminLocale()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null)
  const [formData, setFormData] = useState({ name: '', code: '', isActive: true })

  const { data, isLoading } = useQuery<{ success: boolean; data: Carrier[] }>({
    queryKey: ['carriers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/carriers')
      if (!res.ok) throw new Error('Failed to fetch carriers')
      return res.json()
    },
  })

  const carriers = data?.data || []

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = editingCarrier ? `/api/admin/carriers/${editingCarrier.id}` : '/api/admin/carriers'
      const method = editingCarrier ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save carrier')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] })
      toast.success(editingCarrier ? 'Carrier updated' : 'Carrier created')
      setDialogOpen(false)
      setEditingCarrier(null)
      setFormData({ name: '', code: '', isActive: true })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error saving carrier')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/carriers/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete carrier')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] })
      toast.success('Carrier deleted')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error deleting carrier')
    },
  })

  const handleOpenCreate = () => {
    setEditingCarrier(null)
    setFormData({ name: '', code: '', isActive: true })
    setDialogOpen(true)
  }

  const handleOpenEdit = (carrier: Carrier) => {
    setEditingCarrier(carrier)
    setFormData({ name: carrier.name, code: carrier.code, isActive: carrier.isActive })
    setDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1a3a5c]">Shipping Carriers</h1>
          <p className="text-gray-500 mt-1">Manage shipping lines, airlines, and logistics carriers</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-[#1a3a5c] hover:bg-[#1a3a5c]/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Carrier
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#1a3a5c]" />
                All Carriers
              </CardTitle>
              <CardDescription>
                {carriers.length} registered carriers in the system
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#1a3a5c]" />
            </div>
          ) : carriers.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-base font-medium">No carriers registered yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Add carriers like Maersk, Cosco, or DHL to assign to containers</p>
              <Button onClick={handleOpenCreate} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Add Carrier
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Carrier Code</TableHead>
                    <TableHead>Carrier Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Active Containers</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carriers.map((carrier) => (
                    <TableRow key={carrier.id}>
                      <TableCell className="font-mono font-bold text-gray-900">
                        <Badge variant="outline" className="font-mono bg-gray-50 text-[#1a3a5c]">
                          {carrier.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {carrier.name}
                      </TableCell>
                      <TableCell>
                        {carrier.isActive ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700 border-gray-200">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {carrier._count?.containers || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(carrier)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete carrier ${carrier.name}?`)) {
                                deleteMutation.mutate(carrier.id)
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCarrier ? 'Edit Carrier' : 'Add New Carrier'}</DialogTitle>
            <DialogDescription>
              Enter the carrier name and unique uppercase code (e.g. MAERSK, COSCO).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="code">Carrier Code *</Label>
              <Input
                id="code"
                placeholder="e.g. MAERSK"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Carrier Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Maersk Line"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-[#1a3a5c] focus:ring-[#1a3a5c]"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active Carrier</Label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1a3a5c] hover:bg-[#1a3a5c]/90 text-white"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingCarrier ? 'Update Carrier' : 'Save Carrier'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
