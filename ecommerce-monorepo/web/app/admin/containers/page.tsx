'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { Plus, Ship, Eye, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ContainersPage() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    containerNumber: '',
    shippingMethodId: '',
    vesselName: '',
    voyageNumber: '',
    origin: 'Yiwu, China',
    destination: '',
    estimatedDeparture: '',
    estimatedArrival: '',
    containerType: '40ft',
  })

  const { data: containers, isLoading } = useQuery({
    queryKey: ['containers'],
    queryFn: () => api.get('/api/admin/containers'),
  })

  const { data: shippingMethods } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: () => api.get('/api/admin/shipping-methods'),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/admin/containers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      toast({ title: 'Container created successfully!' })
      setIsDialogOpen(false)
      setFormData({
        containerNumber: '',
        shippingMethodId: '',
        vesselName: '',
        voyageNumber: '',
        origin: 'Yiwu, China',
        destination: '',
        estimatedDeparture: '',
        estimatedArrival: '',
        containerType: '40ft',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: 'bg-gray-100 text-gray-800',
      LOADING: 'bg-yellow-100 text-yellow-800',
      IN_TRANSIT: 'bg-blue-100 text-blue-800',
      AT_SEA: 'bg-indigo-100 text-indigo-800',
      BORDER: 'bg-purple-100 text-purple-800',
      CUSTOMS: 'bg-orange-100 text-orange-800',
      DELIVERED: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Container Management</h1>
          <p className="text-sm text-gray-500">Manage sea freight container shipments</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-[#1a3a5c] hover:bg-[#2a5a8c]">
          <Plus className="w-4 h-4 mr-2" />
          New Container
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Containers</CardTitle>
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
                  <TableHead>Container #</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Origin → Destination</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {containers?.data?.map((container: any) => (
                  <TableRow key={container.id}>
                    <TableCell className="font-medium font-mono text-sm">{container.containerNumber}</TableCell>
                    <TableCell>{container.shippingMethod?.name || 'N/A'}</TableCell>
                    <TableCell className="text-sm">
                      {container.origin} → {container.destination}
                    </TableCell>
                    <TableCell>{container.orders?.length || 0}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(container.status)}>
                        {container.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/containers/${container.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {(!containers?.data || containers.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No containers yet. Click "New Container" to create one.
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
            <DialogTitle>Create New Container</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Container Number *</Label>
                <Input
                  value={formData.containerNumber}
                  onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                  placeholder="e.g., MSCU1234567"
                  required
                />
              </div>
              <div>
                <Label>Shipping Method</Label>
                <Select
                  value={formData.shippingMethodId}
                  onValueChange={(value) => setFormData({ ...formData, shippingMethodId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingMethods?.data?.map((method: any) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vessel Name</Label>
                <Input
                  value={formData.vesselName}
                  onChange={(e) => setFormData({ ...formData, vesselName: e.target.value })}
                  placeholder="Vessel name"
                />
              </div>
              <div>
                <Label>Voyage Number</Label>
                <Input
                  value={formData.voyageNumber}
                  onChange={(e) => setFormData({ ...formData, voyageNumber: e.target.value })}
                  placeholder="Voyage number"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Container Type</Label>
                <Select
                  value={formData.containerType}
                  onValueChange={(value) => setFormData({ ...formData, containerType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20ft">20ft Standard</SelectItem>
                    <SelectItem value="40ft">40ft Standard</SelectItem>
                    <SelectItem value="40ft HC">40ft High Cube</SelectItem>
                    <SelectItem value="20ft Reefer">20ft Reefer</SelectItem>
                    <SelectItem value="40ft Reefer">40ft Reefer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Destination *</Label>
                <Input
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="Destination port"
                  required
                />
              </div>
            </div>
            <div>
              <Label>Origin</Label>
              <Input
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="Loading port"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estimated Departure</Label>
                <Input
                  type="date"
                  value={formData.estimatedDeparture}
                  onChange={(e) => setFormData({ ...formData, estimatedDeparture: e.target.value })}
                />
              </div>
              <div>
                <Label>Estimated Arrival</Label>
                <Input
                  type="date"
                  value={formData.estimatedArrival}
                  onChange={(e) => setFormData({ ...formData, estimatedArrival: e.target.value })}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-[#1a3a5c] hover:bg-[#2a5a8c]"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Ship className="w-4 h-4 mr-2" />
                  Create Container
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
