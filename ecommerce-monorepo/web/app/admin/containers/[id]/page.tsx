'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { Ship, ArrowLeft, Loader2, Package } from 'lucide-react'
import Link from 'next/link'

export default function ContainerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [newStatus, setNewStatus] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newNote, setNewNote] = useState('')

  const { data: containerData, isLoading } = useQuery({
    queryKey: ['container', params.id],
    queryFn: () => api.get(`/api/admin/containers/${params.id}`),
  })

  const container = containerData?.data

  const updateStatusMutation = useMutation({
    mutationFn: (data: any) => api.post(`/api/admin/containers/${params.id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['container', params.id] })
      toast({ title: 'Status updated!' })
      setNewStatus('')
      setNewLocation('')
      setNewNote('')
    },
  })

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

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!container) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Container Not Found</h2>
        <Button onClick={() => router.push('/admin/containers')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Containers
        </Button>
      </div>
    )
  }

  const availableStatuses = container.shippingMethod?.defaultStatuses || [
    'PLANNING', 'LOADING', 'IN_TRANSIT', 'CUSTOMS', 'DELIVERED'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/admin/containers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Container {container.containerNumber}
            </h1>
            <p className="text-sm text-gray-500">
              {container.shippingMethod?.name || 'Shipping'} • {container.vesselName || 'N/A'}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(container.status)}>
          {container.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Container Info + Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="w-5 h-5" />
                Container Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Container Number</p>
                  <p className="font-medium font-mono">{container.containerNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Type</p>
                  <p className="font-medium">{container.containerType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Vessel</p>
                  <p className="font-medium">{container.vesselName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Voyage</p>
                  <p className="font-medium">{container.voyageNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Origin</p>
                  <p className="font-medium">{container.origin}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Destination</p>
                  <p className="font-medium">{container.destination}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Est. Departure</p>
                  <p className="font-medium">{formatDate(container.estimatedDeparture)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Est. Arrival</p>
                  <p className="font-medium">{formatDate(container.estimatedArrival)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              {container.statusHistory && container.statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {container.statusHistory.map((event: any, index: number) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          index === container.statusHistory.length - 1
                            ? 'bg-[#1a3a5c]'
                            : 'bg-gray-300'
                        }`} />
                        {index < container.statusHistory.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">{event.location}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                        {event.note && (
                          <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Ship className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No status history yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right - Update Status + Orders */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label>New Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map((status: string) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Current location"
                  />
                </div>
                <div>
                  <Label>Note (Optional)</Label>
                  <Input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Additional note"
                  />
                </div>
                <Button
                  onClick={() => updateStatusMutation.mutate({
                    status: newStatus,
                    location: newLocation,
                    note: newNote,
                  })}
                  disabled={!newStatus || updateStatusMutation.isPending}
                  className="w-full bg-[#1a3a5c] hover:bg-[#2a5a8c]"
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4" />
                Orders in Container
              </CardTitle>
            </CardHeader>
            <CardContent>
              {container.orders && container.orders.length > 0 ? (
                <div className="space-y-2">
                  {container.orders.map((order: any) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium">#{order.orderNumber}</span>
                      <Badge variant="secondary" className="text-xs">
                        {order.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">No orders assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
