'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const statusColors: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  RETURN_SHIPPED: 'bg-purple-100 text-purple-800',
  RECEIVED: 'bg-indigo-100 text-indigo-800',
  INSPECTING: 'bg-orange-100 text-orange-800',
  REFUND_PROCESSED: 'bg-green-100 text-green-800',
  REFUND_REJECTED: 'bg-red-100 text-red-800',
  CLOSED: 'bg-gray-100 text-gray-800',
}

export default function AdminReturnsPage() {
  const router = useRouter()
  const [returns, setReturns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchReturns()
  }, [page, statusFilter, search])

  const fetchReturns = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(search && { search }),
      })

      const response = await fetch(`/api/admin/returns?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok) {
        setReturns(data.returns)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch returns:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Returns Management</h1>
          <p className="text-gray-600 mt-1">Review and process customer returns</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {total} Returns
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by return number, order number, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="REQUESTED">Requested</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="RETURN_SHIPPED">Return Shipped</option>
              <option value="RECEIVED">Received</option>
              <option value="INSPECTING">Inspecting</option>
              <option value="REFUND_PROCESSED">Refund Processed</option>
              <option value="REFUND_REJECTED">Refund Rejected</option>
              <option value="CLOSED">Closed</option>
            </select>
            <Button onClick={() => fetchReturns()}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Returns List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            <p className="mt-4 text-gray-600">Loading returns...</p>
          </CardContent>
        </Card>
      ) : returns.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-gray-600">No returns found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {returns.map((returnItem) => (
            <Card
              key={returnItem.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/returns/${returnItem.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-lg">{returnItem.returnNumber}</span>
                      <Badge className={statusColors[returnItem.status]}>
                        {returnItem.status.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {returnItem.reason.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Order:</span>{' '}
                        <span className="font-medium">{returnItem.order.orderNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Customer:</span>{' '}
                        <span className="font-medium">{returnItem.order.customerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>{' '}
                        <span className="font-medium">{returnItem.order.customerEmail}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Requested:</span>{' '}
                        <span className="font-medium">{formatDate(returnItem.createdAt)}</span>
                      </div>
                    </div>

                    {returnItem.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {returnItem.description}
                      </p>
                    )}

                    {returnItem.adminNotes && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <span className="font-medium text-blue-900">Admin Notes:</span>{' '}
                        <span className="text-blue-800">{returnItem.adminNotes}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-green-600">
                      {returnItem.refundAmount ? formatCurrency(returnItem.refundAmount) : '-'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {returnItem.refundMethod ? (
                        returnItem.refundMethod.replace(/_/g, ' ')
                      ) : (
                        'Refund pending'
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="mt-4"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/admin/returns/${returnItem.id}`)
                      }}
                    >
                      Review →
                    </Button>
                  </div>
                </div>

                {/* Return Items Preview */}
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Items to Return: {returnItem.items.length}
                  </div>
                  <div className="flex gap-2">
                    {returnItem.items.slice(0, 3).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="text-xs px-2 py-1 bg-gray-100 rounded"
                      >
                        {item.productName} (×{item.quantity})
                      </div>
                    ))}
                    {returnItem.items.length > 3 && (
                      <div className="text-xs px-2 py-1 bg-gray-100 rounded">
                        +{returnItem.items.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="px-4 py-2">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(total / 20)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
