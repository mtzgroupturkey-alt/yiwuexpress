'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { Plus, Pencil, Loader2 } from 'lucide-react'

export default function ShippingMethodsPage() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<any>(null)
  const [statuses, setStatuses] = useState<string[]>([])
  const [newStatus, setNewStatus] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    customStatusesAllowed: true,
  })

  const { data: methods, isLoading } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: () => api.get('/api/admin/shipping-methods'),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/admin/shipping-methods', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-methods'] })
      toast({ title: 'Shipping method created!' })
      setIsDialogOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/api/admin/shipping-methods/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-methods'] })
      toast({ title: 'Shipping method updated!' })
      setIsDialogOpen(false)
      resetForm()
    },
  })

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', customStatusesAllowed: true })
    setStatuses([])
    setNewStatus('')
    setEditingMethod(null)
  }

  const handleEdit = (method: any) => {
    setEditingMethod(method)
    setFormData({
      name: method.name,
      slug: method.slug,
      description: method.description || '',
      customStatusesAllowed: method.customStatusesAllowed,
    })
    setStatuses(method.defaultStatuses || [])
    setIsDialogOpen(true)
  }

  const handleAddStatus = () => {
    if (newStatus && !statuses.includes(newStatus)) {
      setStatuses([...statuses, newStatus])
      setNewStatus('')
    }
  }

  const handleRemoveStatus = (status: string) => {
    setStatuses(statuses.filter(s => s !== status))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      defaultStatuses: statuses,
    }
    if (editingMethod) {
      updateMutation.mutate({ ...data, id: editingMethod.id })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Methods</h1>
          <p className="text-sm text-gray-500">Configure shipping methods and statuses</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true) }} className="bg-[#1a3a5c] hover:bg-[#2a5a8c]">
          <Plus className="w-4 h-4 mr-2" />
          Add Method
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shipping Methods</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status Flow</TableHead>
                  <TableHead>Custom Statuses</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods?.data?.map((method: any) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell className="text-gray-500">{method.slug}</TableCell>
                    <TableCell>
                      <div className="flex items-center flex-wrap gap-1">
                        {(method.defaultStatuses || []).map((status: string, index: number) => (
                          <span key={status} className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs whitespace-nowrap">
                              {status}
                            </Badge>
                            {index < (method.defaultStatuses?.length || 0) - 1 && (
                              <span className="text-gray-300 text-xs">→</span>
                            )}
                          </span>
                        ))}
                        {(!method.defaultStatuses || method.defaultStatuses.length === 0) && (
                          <span className="text-gray-400 text-sm">No statuses defined</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={method.customStatusesAllowed ? 'default' : 'secondary'}>
                        {method.customStatusesAllowed ? 'Allowed' : 'Fixed'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(method)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!methods?.data || methods.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No shipping methods yet. Click "Add Method" to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMethod ? 'Edit' : 'Create'} Shipping Method</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Method Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sea Freight"
                  required
                />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., sea"
                  required
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description of this shipping method"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="customStatuses"
                checked={formData.customStatusesAllowed}
                onChange={(e) => setFormData({ ...formData, customStatusesAllowed: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="customStatuses">Allow custom statuses for this method</Label>
            </div>

            <div>
              <Label>Status Flow</Label>
              <p className="text-sm text-gray-500 mb-2">
                Define the default status flow for this shipping method
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {statuses.map((status) => (
                  <Badge key={status} className="flex items-center gap-1 bg-[#1a3a5c] text-white">
                    {status}
                    <button
                      type="button"
                      onClick={() => handleRemoveStatus(status)}
                      className="hover:text-red-300 ml-1"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  placeholder="Add status (e.g., AT_SEA)"
                  className="flex-1"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStatus() } }}
                />
                <Button type="button" variant="outline" onClick={handleAddStatus}>
                  Add
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full bg-[#1a3a5c] hover:bg-[#2a5a8c]"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingMethod ? 'Update' : 'Create'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
