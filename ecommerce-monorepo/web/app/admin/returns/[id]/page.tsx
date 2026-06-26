'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

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

export default function AdminReturnDetailPage() {
  const router = useRouter()
  const params = useParams()
  const returnId = params.id as string

  const [returnData, setReturnData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundMethod, setRefundMethod] = useState('original_payment')

  useEffect(() => {
    fetchReturn()
  }, [returnId])

  const fetchReturn = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/returns/${returnId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok) {
        setReturnData(data.return)
        setAdminNotes(data.return.adminNotes || '')
        setRefundAmount(data.return.refundAmount?.toString() || '')
        setRefundMethod(data.return.refundMethod || 'original_payment')
      }
    } catch (error) {
      console.error('Failed to fetch return:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateReturn = async (status: string) => {
    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/returns/${returnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          adminNotes,
          ...(refundAmount && { refundAmount: parseFloat(refundAmount) }),
          refundMethod,
        }),
      })

      if (response.ok) {
        fetchReturn()
        alert('Return updated successfully!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update return')
      }
    } catch (error) {
      console.error('Failed to update return:', error)
      alert('An error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
        </div>
      </div>
    )
  }

  if (!returnData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-gray-600">Return not found</p>
            <Button onClick={() => router.push('/admin/returns')} className="mt-4">
              Back to Returns
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={() => router.push('/admin/returns')}>
            ← Back to Returns
          </Button>
          <h1 className="text-3xl font-bold mt-4">{returnData.returnNumber}</h1>
          <p className="text-gray-600 mt-1">Return Request Details</p>
        </div>
        <Badge className={`${statusColors[returnData.status]} text-lg px-4 py-2`}>
          {returnData.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Name</div>
                <div className="font-medium">{returnData.user.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <div className="font-medium">{returnData.user.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div className="font-medium">{returnData.user.phone || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Original Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Order Number</div>
                <div className="font-medium">{returnData.order.orderNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Order Total</div>
                <div className="font-medium">{formatCurrency(returnData.order.total)}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/admin/orders/${returnData.orderId}`)}
              >
                View Full Order →
              </Button>
            </CardContent>
          </Card>

          {/* Return Details */}
          <Card>
            <CardHeader>
              <CardTitle>Return Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Reason</div>
                <div className="font-medium">{returnData.reason.replace(/_/g, ' ')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Description</div>
                <div className="text-sm">{returnData.description || 'No description provided'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Requested On</div>
                <div className="font-medium">{formatDate(returnData.createdAt)}</div>
              </div>
              {returnData.images && returnData.images.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Images</div>
                  <div className="flex gap-2">
                    {returnData.images.map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Return image ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items to Return */}
          <Card>
            <CardHeader>
              <CardTitle>Items to Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {returnData.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                      {item.reason && (
                        <div className="text-sm text-gray-600">Reason: {item.reason}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Admin Actions */}
        <div className="space-y-6">
          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="Add notes about this return..."
                />
              </div>

              <div>
                <Label htmlFor="refundAmount">Refund Amount ($)</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="refundMethod">Refund Method</Label>
                <select
                  id="refundMethod"
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                >
                  <option value="original_payment">Original Payment Method</option>
                  <option value="store_credit">Store Credit</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Status Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {returnData.status === 'REQUESTED' && (
                <>
                  <Button
                    onClick={() => updateReturn('APPROVED')}
                    disabled={isUpdating}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    ✓ Approve Return
                  </Button>
                  <Button
                    onClick={() => updateReturn('REJECTED')}
                    disabled={isUpdating}
                    variant="destructive"
                    className="w-full"
                  >
                    ✗ Reject Return
                  </Button>
                </>
              )}

              {returnData.status === 'APPROVED' && (
                <Button
                  onClick={() => updateReturn('RETURN_SHIPPED')}
                  disabled={isUpdating}
                  className="w-full"
                >
                  Mark as Return Shipped
                </Button>
              )}

              {returnData.status === 'RETURN_SHIPPED' && (
                <Button
                  onClick={() => updateReturn('RECEIVED')}
                  disabled={isUpdating}
                  className="w-full"
                >
                  Mark as Received
                </Button>
              )}

              {returnData.status === 'RECEIVED' && (
                <Button
                  onClick={() => updateReturn('INSPECTING')}
                  disabled={isUpdating}
                  className="w-full"
                >
                  Start Inspection
                </Button>
              )}

              {returnData.status === 'INSPECTING' && (
                <>
                  <Button
                    onClick={() => updateReturn('REFUND_PROCESSED')}
                    disabled={isUpdating || !refundAmount}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Process Refund
                  </Button>
                  <Button
                    onClick={() => updateReturn('REFUND_REJECTED')}
                    disabled={isUpdating}
                    variant="destructive"
                    className="w-full"
                  >
                    Reject Refund
                  </Button>
                </>
              )}

              {returnData.status === 'REFUND_PROCESSED' && (
                <Button
                  onClick={() => updateReturn('CLOSED')}
                  disabled={isUpdating}
                  className="w-full"
                >
                  Close Return
                </Button>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-600">
                  Current workflow: REQUESTED → APPROVED → RETURN_SHIPPED → RECEIVED → INSPECTING → REFUND_PROCESSED → CLOSED
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {(returnData.reviewedAt || returnData.returnShippedAt || returnData.returnReceivedAt || returnData.refundedAt) && (
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium">Created</div>
                    <div className="text-gray-600">{formatDate(returnData.createdAt)}</div>
                  </div>
                  {returnData.reviewedAt && (
                    <div>
                      <div className="font-medium">Reviewed</div>
                      <div className="text-gray-600">{formatDate(returnData.reviewedAt)}</div>
                    </div>
                  )}
                  {returnData.returnShippedAt && (
                    <div>
                      <div className="font-medium">Return Shipped</div>
                      <div className="text-gray-600">{formatDate(returnData.returnShippedAt)}</div>
                    </div>
                  )}
                  {returnData.returnReceivedAt && (
                    <div>
                      <div className="font-medium">Received</div>
                      <div className="text-gray-600">{formatDate(returnData.returnReceivedAt)}</div>
                    </div>
                  )}
                  {returnData.refundedAt && (
                    <div>
                      <div className="font-medium">Refunded</div>
                      <div className="text-gray-600">{formatDate(returnData.refundedAt)}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
