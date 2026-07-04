'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MessageSquare, DollarSign, Package, CheckCircle } from 'lucide-react'

interface WholesaleInquiry {
  id: string
  companyName: string
  contactName: string
  email: string
  phone?: string
  status: string
  quantity: number
  targetPrice?: number
  message: string
  deliveryAddress?: any
  adminNotes?: string
  internalNotes?: string
  priority?: string
  createdAt: string
  user?: {
    name?: string
    firstName?: string
    lastName?: string
    email: string
    phone?: string
  }
  quotedPrice?: number
  quotedBy?: string
  quotedAt?: string
  quoteValidUntil?: string
  quoteNotes?: string
  quotes?: Array<{ id: string; status: string; unitPrice: number; quantity: number; totalPrice: number; validUntil: string; createdAt: string; notes?: string }>
}

export default function AdminWholesaleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [inquiry, setInquiry] = useState<WholesaleInquiry | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Status update
  const [newStatus, setNewStatus] = useState('')

  // Quote form
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [quoteData, setQuoteData] = useState({
    unitPrice: '',
    quantity: '',
    validUntil: '',
    notes: ''
  })

  useEffect(() => {
    fetchInquiry()
  }, [params.id])

  const fetchInquiry = async () => {
    try {
      const response = await fetch(`/api/admin/wholesale/${params.id}`)
      const data = await response.json()

      if (data.success && data.data) {
        setInquiry(data.data)
        setNewStatus(data.data.status)
        setQuoteData(prev => ({
          ...prev,
          quantity: data.data.quantity.toString()
        }))
      } else {
        alert('Wholesale inquiry not found')
        router.push('/admin/wholesale')
      }
    } catch (error) {
      console.error('Error fetching inquiry:', error)
      alert('Failed to load inquiry')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      alert('Please select a status')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/wholesale/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()

      if (result.success) {
        alert('Status updated successfully!')
        fetchInquiry()
      } else {
        alert(result.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateQuote = async () => {
    if (!quoteData.unitPrice || !quoteData.quantity) {
      alert('Unit price and quantity are required')
      return
    }

    const unitPrice = parseFloat(quoteData.unitPrice)
    const quantity = parseInt(quoteData.quantity)
    const totalPrice = unitPrice * quantity

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/wholesale/${params.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitPrice,
          quantity,
          totalPrice,
          validUntil: quoteData.validUntil,
          notes: quoteData.notes
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('Quote created successfully!')
        setShowQuoteForm(false)
        setQuoteData({
          unitPrice: '',
          quantity: inquiry?.quantity.toString() || '',
          validUntil: '',
          notes: ''
        })
        fetchInquiry()
      } else {
        alert(result.error || 'Failed to create quote')
      }
    } catch (error) {
      console.error('Error creating quote:', error)
      alert('Failed to create quote')
    } finally {
      setUpdating(false)
    }
  }

  const handleConvertToOrder = async () => {
    if (!confirm('Convert this wholesale inquiry to an order? This requires an accepted quote.')) {
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/wholesale/${params.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'bank_transfer',
          shippingAddress: inquiry?.deliveryAddress,
          billingAddress: inquiry?.deliveryAddress
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('Successfully converted to order!')
        router.push(`/admin/orders/${result.data.id}`)
      } else {
        alert(result.error || 'Failed to convert to order')
      }
    } catch (error) {
      console.error('Error converting to order:', error)
      alert('Failed to convert to order')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      reviewing: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-purple-100 text-purple-800',
      negotiating: 'bg-orange-100 text-orange-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      converted: 'bg-teal-100 text-teal-800',
      expired: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inquiry...</p>
        </div>
      </div>
    )
  }

  if (!inquiry) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Inquiry not found</p>
        </div>
      </div>
    )
  }

  const hasAcceptedQuote = inquiry.quotes?.some(q => q.status === 'accepted')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/wholesale')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inquiries
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{inquiry.companyName}</h1>
            <p className="text-gray-600">
              Submitted on {new Date(inquiry.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(inquiry.status)}>
          {inquiry.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inquiry Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Inquiry Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Quantity Requested</p>
                  <p className="text-lg font-semibold">{inquiry.quantity.toLocaleString()} units</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Target Price</p>
                  <p className="text-lg font-semibold">
                    {inquiry.targetPrice ? `$${inquiry.targetPrice.toFixed(2)}/unit` : 'Not specified'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Message</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
                </div>
              </div>

              {inquiry.deliveryAddress && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Delivery Address</p>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(inquiry.deliveryAddress, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quotes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Quotes ({inquiry.quotes?.length || 0})
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowQuoteForm(!showQuoteForm)}
                >
                  {showQuoteForm ? 'Cancel' : 'Create Quote'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showQuoteForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                  <h3 className="font-semibold">New Quote</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="unitPrice">Unit Price ($) *</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        step="0.01"
                        value={quoteData.unitPrice}
                        onChange={(e) => setQuoteData({ ...quoteData, unitPrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={quoteData.quantity}
                        onChange={(e) => setQuoteData({ ...quoteData, quantity: e.target.value })}
                      />
                    </div>
                  </div>
                  {quoteData.unitPrice && quoteData.quantity && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm font-semibold">
                        Total Price: ${(parseFloat(quoteData.unitPrice) * parseInt(quoteData.quantity)).toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={quoteData.validUntil}
                      onChange={(e) => setQuoteData({ ...quoteData, validUntil: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quoteNotes">Notes</Label>
                    <textarea
                      id="quoteNotes"
                      value={quoteData.notes}
                      onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    />
                  </div>
                  <Button onClick={handleCreateQuote} disabled={updating}>
                    {updating ? 'Creating...' : 'Create Quote'}
                  </Button>
                </div>
              )}

              {inquiry.quotes && inquiry.quotes.length > 0 ? (
                <div className="space-y-4">
                  {inquiry.quotes.map((quote) => (
                    <div key={quote.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Unit Price</p>
                          <p className="text-xl font-bold">${quote.unitPrice.toFixed(2)}</p>
                        </div>
                        <Badge className={getStatusColor(quote.status)}>
                          {quote.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Quantity</p>
                          <p className="font-semibold">{quote.quantity.toLocaleString()} units</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Price</p>
                          <p className="font-semibold">${quote.totalPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Valid Until</p>
                          <p className="font-semibold">
                            {new Date(quote.validUntil).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Created</p>
                          <p className="font-semibold">
                            {new Date(quote.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {quote.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">{quote.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No quotes yet</p>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Contact Name</p>
                <p className="font-medium">{inquiry.contactName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{inquiry.email}</p>
              </div>
              {inquiry.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{inquiry.phone}</p>
                </div>
              )}
              {inquiry.user && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600 mb-2">Customer Account</p>
                  <p className="font-medium">
                    {inquiry.user.firstName} {inquiry.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{inquiry.user.email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">New Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value)}
                >
                  <option value="new">New</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="quoted">Quoted</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="converted">Converted</option>
                  <option value="expired">Expired</option>
                </Select>
              </div>

              <Button
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === inquiry.status}
                className="w-full"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowQuoteForm(true)}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Create Quote
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleConvertToOrder}
                disabled={!hasAcceptedQuote || inquiry.status === 'converted'}
              >
                <Package className="w-4 h-4 mr-2" />
                Convert to Order
              </Button>
            </CardContent>
          </Card>

          {/* Timeline Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Inquiry Submitted</p>
                    <p className="text-xs text-gray-500">
                      {new Date(inquiry.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {inquiry.quotes && inquiry.quotes.map((quote) => (
                  <div key={quote.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-purple-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Quote Created</p>
                      <p className="text-xs text-gray-500">
                        {new Date(quote.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
