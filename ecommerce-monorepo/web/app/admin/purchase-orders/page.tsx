'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Eye, Search, FileDown, Filter, Edit, Trash2 } from 'lucide-react'

const getStatusBadge = (status: string) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT: { bg: 'bg-gray-500', text: 'text-white', label: 'DRAFT' },
    PENDING: { bg: 'bg-yellow-500', text: 'text-white', label: 'PENDING' },
    SENT: { bg: 'bg-blue-500', text: 'text-white', label: 'SENT' },
    CONFIRMED: { bg: 'bg-indigo-500', text: 'text-white', label: 'CONFIRMED' },
    SHIPPED: { bg: 'bg-purple-500', text: 'text-white', label: 'SHIPPED' },
    RECEIVED: { bg: 'bg-green-500', text: 'text-white', label: 'RECEIVED' },
    CANCELLED: { bg: 'bg-red-500', text: 'text-white', label: 'CANCELLED' },
    CLOSED: { bg: 'bg-gray-600', text: 'text-white', label: 'CLOSED' },
  }
  
  const statusConfig = config[status] || config.DRAFT
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
      {statusConfig.label}
    </span>
  )
}

interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  status: string
  total: number
  currency: string
  exchangeRate: number
  orderDate: string
  expectedDelivery?: string
  supplier: {
    name: string
  }
  _count: {
    items: number
  }
}

export default function PurchaseOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: purchaseOrders, isLoading } = useQuery<{ purchaseOrders: PurchaseOrder[] }>({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const res = await fetch('/api/admin/purchase-orders')
      if (!res.ok) throw new Error('Failed to fetch purchase orders')
      const data = await res.json()
      console.log('Purchase Orders data:', data)
      return data
    },
  })

  const filteredOrders = purchaseOrders?.purchaseOrders?.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || po.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const stats = {
    total: purchaseOrders?.purchaseOrders?.length || 0,
    pending: purchaseOrders?.purchaseOrders?.filter((po) => po.status === 'PENDING' || po.status === 'SENT' || po.status === 'CONFIRMED').length || 0,
    received: purchaseOrders?.purchaseOrders?.filter((po) => po.status === 'RECEIVED' || po.status === 'CLOSED').length || 0,
    value: purchaseOrders?.purchaseOrders?.reduce((sum, po) => {
      // Convert to USD if not already in USD
      if (po.currency === 'USD') {
        return sum + po.total
      } else {
        // Divide by exchange rate to convert to USD
        // Example: 105 AFN / 64.559188 = 1.62 USD
        return sum + (po.total / (po.exchangeRate || 1))
      }
    }, 0) || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1a3a5c]">Purchase Orders</h1>
          <p className="text-gray-500 mt-1">Manage purchases from suppliers</p>
        </div>
        <Link href="/admin/purchase-orders/new">
          <Button className="bg-[#1a3a5c] hover:bg-[#1a3a5c]/90">
            <Plus className="w-4 h-4 mr-2" />
            Create Purchase Order
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total POs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a3a5c]">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-gray-500 mt-1">Pending, Sent, Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.received}</div>
            <p className="text-xs text-gray-500 mt-1">Received, Closed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Value (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a3a5c]">${stats.value.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Converted to USD</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Purchase Orders</CardTitle>
              <CardDescription>Track and manage all purchase orders</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search PO..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-md border border-gray-300"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="SENT">Sent</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-[#1a3a5c] rounded-full animate-spin"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders && filteredOrders.length > 0 ? (
                  filteredOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.poNumber}</TableCell>
                      <TableCell>{po.supplier.name}</TableCell>
                      <TableCell>
                        {new Date(po.orderDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{po._count.items} items</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="font-semibold">
                          {po.currency} {po.total.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ≈ ${(po.currency === 'USD' ? po.total : po.total / (po.exchangeRate || 1)).toFixed(2)} USD
                          {po.currency !== 'USD' && po.exchangeRate && (
                            <span className="text-[10px] ml-1">(rate: {po.exchangeRate})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {po.expectedDelivery
                          ? new Date(po.expectedDelivery).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(po.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/purchase-orders/${po.id}`}>
                            <Button variant="ghost" size="sm" title="View Details">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/purchase-orders/${po.id}/edit`}>
                            <Button variant="ghost" size="sm" title="Edit" className="text-blue-600 hover:text-blue-700">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Delete"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete PO ${po.poNumber}?`)) {
                                // Add delete functionality here
                                fetch(`/api/admin/purchase-orders/${po.id}`, {
                                  method: 'DELETE',
                                }).then(() => {
                                  window.location.reload()
                                })
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      No purchase orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
